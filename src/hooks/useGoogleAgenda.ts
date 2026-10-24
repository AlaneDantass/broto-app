import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { IntegracaoGoogleAgenda } from "../types/database";

const SYNC_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`;

interface UseGoogleAgendaReturn {
  integrado: boolean;
  emailGoogle: string | null;
  conectadoEm: string | null;
  carregando: boolean;
  conectando: boolean;
  desconectando: boolean;
  conectar: () => Promise<void>;
  desconectar: () => Promise<void>;
  callSync: (body: Record<string, unknown>) => Promise<Response>;
}

/**
 * Hook responsável pelo estado da integração com Google Agenda.
 * Conectar, desconectar e chamar a Edge Function de sincronização.
 * Os tokens nunca chegam ao cliente — ficam apenas no servidor Supabase.
 */
export const useGoogleAgenda = (): UseGoogleAgendaReturn => {
  const { user } = useAuth();
  const [integracao, setIntegracao] = useState<IntegracaoGoogleAgenda | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [desconectando, setDesconectando] = useState(false);

  // Carrega o status da integração do banco
  const fetchIntegracao = useCallback(async () => {
    if (!user) {
      setCarregando(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("integracoes_google_agenda")
        .select("id, usuario_id, email_google, calendario_google_id, conectado_em, ativo")
        .eq("usuario_id", user.id)
        .eq("ativo", true)
        .maybeSingle();

      setIntegracao(data ?? null);
      if (data) {
        setConectando(false);
      }
    } catch (err) {
      console.error("useGoogleAgenda: erro ao carregar integração", err);
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    fetchIntegracao();

    if (!user) return;

    // Realtime listener para atualizar automaticamente quando o OAuth concluir no navegador ou Tauri
    const channelId = Math.random().toString(36).substring(7);
    const subscription = supabase
      .channel(`integracoes_google_agenda:${user.id}:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "integracoes_google_agenda",
          filter: `usuario_id=eq.${user.id}`,
        },
        () => {
          fetchIntegracao();
        }
      )
      .subscribe();

    const handleWindowFocus = () => {
      fetchIntegracao();
    };
    window.addEventListener("focus", handleWindowFocus);

    // Listener para deep link broto://oauth-success — Tauri dispara quando o OAuth retorna
    // Usa a API de deep link do Tauri se disponível
    let unlistenFn: (() => void) | undefined;

    const setupDeepLinkListener = async () => {
      try {
        // Importa dinamicamente — só funciona dentro do Tauri
        const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
        unlistenFn = await onOpenUrl((urls: string[]) => {
          for (const url of urls) {
            if (url.startsWith("broto://oauth-success")) {
              // OAuth concluído com sucesso — recarrega o status da integração
              setConectando(false);
              fetchIntegracao();
            }
            if (url.startsWith("broto://oauth-error")) {
              const errParam = new URL(url).searchParams.get("error");
              console.error("OAuth Google falhou:", errParam);
              setConectando(false);
            }
          }
        });
      } catch {
        // Fora do Tauri (dev browser) — ignorar silenciosamente
      }
    };

    setupDeepLinkListener();

    return () => {
      supabase.removeChannel(subscription);
      window.removeEventListener("focus", handleWindowFocus);
      if (unlistenFn) unlistenFn();
    };
  }, [user, fetchIntegracao]);

  /**
   * Inicia o fluxo OAuth: pede a URL à Edge Function e abre no browser externo.
   */
  const conectar = useCallback(async () => {
    if (!user) return;
    setConectando(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error("Sessão inválida");

      // Pede a URL OAuth gerada no servidor (com state = usuario_id)
      const res = await fetch(SYNC_FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "get_oauth_url" }),
      });

      if (!res.ok) throw new Error("Erro ao obter URL OAuth");
      const { url } = await res.json();

      // Abre o browser externo do sistema com a URL OAuth
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opener = await import("@tauri-apps/plugin-opener" as any);
        await opener.open(url);
      } catch {
        // Fallback para ambiente de desenvolvimento (browser web)
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("useGoogleAgenda: erro ao conectar", err);
      setConectando(false);
    }
    // conectando fica true até o deep link broto://oauth-success chegar
  }, [user]);

  /**
   * Remove a integração do banco — efetivamente desconecta.
   */
  const desconectar = useCallback(async () => {
    if (!user) return;
    setDesconectando(true);
    try {
      await supabase
        .from("integracoes_google_agenda")
        .delete()
        .eq("usuario_id", user.id);
      setIntegracao(null);
    } catch (err) {
      console.error("useGoogleAgenda: erro ao desconectar", err);
    } finally {
      setDesconectando(false);
    }
  }, [user]);

  /**
   * Chama a Edge Function google-calendar-sync com o body fornecido.
   * Retorna a Response bruta para o chamador tratar.
   */
  const callSync = useCallback(
    async (body: Record<string, unknown>): Promise<Response> => {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error("Sessão inválida");

      return fetch(SYNC_FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    },
    []
  );

  return {
    integrado: !!integracao,
    emailGoogle: integracao?.email_google ?? null,
    conectadoEm: integracao?.conectado_em ?? null,
    carregando,
    conectando,
    desconectando,
    conectar,
    desconectar,
    callSync,
  };
};
