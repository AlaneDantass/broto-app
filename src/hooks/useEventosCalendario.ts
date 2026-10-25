import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { EventoCalendario } from "../types/database";
import { useAuth } from "../contexts/AuthContext";
import { useGoogleAgenda } from "./useGoogleAgenda";

/** Intervalo de polling Google → Broto (5 minutos) */
const PULL_INTERVAL_MS = 5 * 60 * 1000;

export const useEventosCalendario = () => {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const pullIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { integrado, callSync } = useGoogleAgenda();

  const fetchEventos = useCallback(async () => {
    if (!user) return;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      const { data, error: err } = await supabase
        .from("eventos_calendario")
        .select("*")
        .eq("usuario_id", user.id)
        .order("data", { ascending: true });

      if (err) throw err;
      setEventos(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar eventos"
      );
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [user]);

  /**
   * Puxa eventos novos do Google Agenda para o Broto.
   * Só executa se houver integração ativa. Silencioso — erros são logados apenas.
   */
  const pullFromGoogle = useCallback(async () => {
    if (!integrado) return;
    try {
      const res = await callSync({ action: "pull" });
      if (res.ok) {
        const { importados } = await res.json();
        if (importados > 0) {
          // Recarregar lista local se houver novidades
          await fetchEventos();
        }
      }
    } catch (err) {
      console.error("pullFromGoogle: erro", err);
    }
  }, [integrado, callSync, fetchEventos]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchEventos();

    // Realtime Supabase
    const channelId = Math.random().toString(36).substring(7);
    const subscription = supabase
      .channel(`eventos_calendario:${user.id}:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos_calendario",
          filter: `usuario_id=eq.${user.id}`,
        },
        () => {
          fetchEventos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchEventos]);

  // Polling periódico Google → Broto (só quando integração está ativa)
  useEffect(() => {
    if (pullIntervalRef.current) {
      clearInterval(pullIntervalRef.current);
      pullIntervalRef.current = null;
    }

    if (integrado) {
      // Puxa imediatamente ao conectar e depois a cada PULL_INTERVAL_MS
      pullFromGoogle();
      pullIntervalRef.current = setInterval(pullFromGoogle, PULL_INTERVAL_MS);
    }

    return () => {
      if (pullIntervalRef.current) {
        clearInterval(pullIntervalRef.current);
        pullIntervalRef.current = null;
      }
    };
  }, [integrado, pullFromGoogle]);

  /**
   * Cria um evento manual no Broto e, se houver integração ativa,
   * replica para o Google Calendar.
   */
  const createEvento = async (
    evento: Omit<EventoCalendario, "id" | "usuario_id" | "criado_em">,
    options?: { skipGoogleSync?: boolean }
  ): Promise<EventoCalendario | null> => {
    if (!user) throw new Error("Usuário não autenticado");

    // Garante que eventos criados pelo usuário são sempre "manual"
    const eventoComOrigem = { ...evento, origem: "manual" as const };

    const { data: created, error: err } = await supabase
      .from("eventos_calendario")
      .insert({ ...eventoComOrigem, usuario_id: user.id })
      .select()
      .single();

    if (err) throw err;

    await fetchEventos();

    // Sincronizar com Google (em background — sem bloquear a UI)
    if (integrado && created && !options?.skipGoogleSync) {
      callSync({ action: "create", evento: created }).catch((syncErr) =>
        console.error("createEvento: erro ao sincronizar com Google", syncErr)
      );
    }

    return (created as EventoCalendario) ?? null;
  };

  /**
   * Atualiza um evento no Broto e, se for manual e tiver google_event_id,
   * atualiza no Google Calendar.
   */
  const updateEvento = async (
    id: string,
    updates: Partial<Omit<EventoCalendario, "id" | "usuario_id" | "criado_em">>
  ) => {
    const { error: err } = await supabase
      .from("eventos_calendario")
      .update(updates)
      .eq("id", id)
      .eq("usuario_id", user?.id);

    if (err) throw err;

    await fetchEventos();

    // Sincronizar com Google apenas se for evento manual com vínculo
    if (integrado) {
      const eventoAtualizado = eventos.find((e) => e.id === id);
      if (eventoAtualizado?.origem === "manual" && eventoAtualizado?.google_event_id) {
        const eventoMerged = { ...eventoAtualizado, ...updates };
        callSync({ action: "update", evento: eventoMerged }).catch((syncErr) =>
          console.error("updateEvento: erro ao sincronizar com Google", syncErr)
        );
      }
    }
  };

  /**
   * Remove um evento do Broto e, se for manual com google_event_id,
   * remove do Google Calendar.
   */
  const deleteEvento = async (id: string) => {
    // Capturar antes de deletar para ter o google_event_id
    const eventoParaDeletar = eventos.find((e) => e.id === id);

    const { error: err } = await supabase
      .from("eventos_calendario")
      .delete()
      .eq("id", id)
      .eq("usuario_id", user?.id);

    if (err) throw err;

    await fetchEventos();

    // Remover do Google se for evento manual vinculado
    if (integrado && eventoParaDeletar?.origem === "manual" && eventoParaDeletar?.google_event_id) {
      callSync({
        action: "delete",
        google_event_id: eventoParaDeletar.google_event_id,
      }).catch((syncErr) =>
        console.error("deleteEvento: erro ao sincronizar com Google", syncErr)
      );
    }
  };

  const getEventosDoMes = (ano: number, mes: number) => {
    return eventos.filter((e) => {
      const [year, month] = e.data.split("-").slice(0, 2);
      return parseInt(year) === ano && parseInt(month) === mes;
    });
  };

  const getEventosDoDia = (data: string) => {
    return eventos.filter((e) => e.data === data);
  };

  return {
    eventos,
    loading,
    error,
    createEvento,
    updateEvento,
    deleteEvento,
    getEventosDoMes,
    getEventosDoDia,
    pullFromGoogle,
  };
};
