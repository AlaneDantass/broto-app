/**
 * SensorialContext.tsx
 *
 * Aplica as preferências sensoriais do usuário globalmente:
 * - Tema (data-tema no <html>)
 * - Reduzir animações (data-reduzir-animacoes no <html>)
 * - Poucas cores (data-poucas-cores no <html>)
 * - Lembretes de transição: avisa 10 min antes de eventos do calendário
 * - Expõe somRecompensaAtivo para outros componentes
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useConfiguracoes } from "../hooks/useConfiguracoes";
import { supabase } from "../lib/supabase";
import type { EventoCalendario } from "../types/database";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface TransitionAlert {
  id: string;
  titulo: string;
  minutosRestantes: number;
}

interface SensorialContextValue {
  somRecompensaAtivo: boolean;
  poucasCoresAtivo: boolean;
  alertaTransicao: TransitionAlert | null;
  dismissAlerta: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SensorialContext = createContext<SensorialContextValue>({
  somRecompensaAtivo: false,
  poucasCoresAtivo: false,
  alertaTransicao: null,
  dismissAlerta: () => {},
});

export const useSensorial = () => useContext(SensorialContext);

// ─── Provider ────────────────────────────────────────────────────────────────

export const SensorialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { config } = useConfiguracoes();
  const [alertaTransicao, setAlertaTransicao] = useState<TransitionAlert | null>(null);
  const [poucasCoresAtivo, setPoucasCoresAtivo] = useState<boolean>(
    () => localStorage.getItem("broto_poucas_cores") === "true"
  );

  // IDs de eventos que já receberam alerta nesta sessão — evita repetição
  const alertadosRef = useRef<Set<string>>(new Set());

  // ── Aplica a partir do localStorage imediatamente (sem flash) ───────────
  useEffect(() => {
    const html = document.documentElement;
    const initialPoucasCores = localStorage.getItem("broto_poucas_cores") ?? "false";
    html.setAttribute("data-tema",              localStorage.getItem("broto_tema") ?? "claro");
    html.setAttribute("data-reduzir-animacoes", localStorage.getItem("broto_reduzir_animacoes") ?? "false");
    html.setAttribute("data-poucas-cores",      initialPoucasCores);
    html.setAttribute("data-preto-branco",      localStorage.getItem("broto_preto_branco") ?? "false");
    setPoucasCoresAtivo(initialPoucasCores === "true");

    const observer = new MutationObserver(() => {
      setPoucasCoresAtivo(html.getAttribute("data-poucas-cores") === "true");
    });
    observer.observe(html, { attributes: true, attributeFilter: ["data-poucas-cores"] });
    return () => observer.disconnect();
  }, []);

  // ── Sincroniza com o banco quando o config chegar/mudar ─────────────────
  useEffect(() => {
    if (!config) return; // aguarda o carregamento inicial

    const html = document.documentElement;
    const tema        = config.tema ?? "claro";
    const reduzir     = String(config.reduzir_animacoes_ativo ?? false);
    const poucasCores = String(config.poucas_cores_pouco_texto_ativo ?? false);
    const pretoBranco = String(config.modo_preto_branco_ativo ?? false);

    html.setAttribute("data-tema",              tema);
    html.setAttribute("data-reduzir-animacoes", reduzir);
    html.setAttribute("data-poucas-cores",      poucasCores);
    html.setAttribute("data-preto-branco",      pretoBranco);
    setPoucasCoresAtivo(poucasCores === "true");

    // Persiste no localStorage para a próxima navegação/render ser instantânea
    localStorage.setItem("broto_tema",                tema);
    localStorage.setItem("broto_reduzir_animacoes",   reduzir);
    localStorage.setItem("broto_poucas_cores",        poucasCores);
    localStorage.setItem("broto_preto_branco",        pretoBranco);
  }, [config?.tema, config?.reduzir_animacoes_ativo, config?.poucas_cores_pouco_texto_ativo, config?.modo_preto_branco_ativo]);


  // ── Lembretes de Transição ───────────────────────────────────────────────
  const checkUpcomingEvents = useCallback(async () => {
    if (!user || !config?.lembretes_transicao_ativo) return;

    const now = new Date();
    const em10min = new Date(now.getTime() + 10 * 60 * 1000);
    const em12min = new Date(now.getTime() + 12 * 60 * 1000);

    // Janela de hoje
    const hoje = now.toISOString().split("T")[0];

    const { data: eventos } = await supabase
      .from("eventos_calendario")
      .select("id, titulo, data, hora")
      .eq("usuario_id", user.id)
      .eq("data", hoje)
      .not("hora", "is", null);

    if (!eventos) return;

    for (const evento of eventos as EventoCalendario[]) {
      if (!evento.hora || alertadosRef.current.has(evento.id)) continue;

      const inicioEvento = new Date(`${evento.data}T${evento.hora}`);

      if (inicioEvento >= em10min && inicioEvento <= em12min) {
        alertadosRef.current.add(evento.id);

        const diffMs = inicioEvento.getTime() - now.getTime();
        const minutosRestantes = Math.round(diffMs / 60000);

        setAlertaTransicao({
          id: evento.id,
          titulo: evento.titulo,
          minutosRestantes,
        });
        break; // mostra um alerta por vez
      }
    }
  }, [user, config?.lembretes_transicao_ativo]);

  useEffect(() => {
    if (!config?.lembretes_transicao_ativo) return;

    // Checa imediatamente e depois a cada 60s
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 60_000);
    return () => clearInterval(interval);
  }, [config?.lembretes_transicao_ativo, checkUpcomingEvents]);

  const dismissAlerta = useCallback(() => setAlertaTransicao(null), []);

  // ── Valor do context ─────────────────────────────────────────────────────
  const value: SensorialContextValue = {
    somRecompensaAtivo: config?.som_recompensa_ativo ?? false,
    poucasCoresAtivo,
    alertaTransicao,
    dismissAlerta,
  };

  return (
    <SensorialContext.Provider value={value}>
      {children}
    </SensorialContext.Provider>
  );
};
