export interface Bloco {
  id: string;
  usuario_id: string;
  nome: string;
  descricao: string;
  categoria: string;
  icone?: string;
  imagem_capa_url?: string;
  meta_label?: string;
  meta_atual: number;
  meta_total: number;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Task {
  id: string;
  usuario_id: string;
  bloco_id: string;
  titulo: string;
  descricao?: string;
  is_programming: boolean;
  status: "pendente" | "em_andamento" | "concluida";
  energia_estimada?: number;
  contexto?: string;
  prioridade_numerica?: number;
  prioridade?: "urgente" | "bloqueadora" | "importante" | null;
  ordem: number;
  pomodoros_estimados?: number;
  pomodoros_concluidos: number;
  notas?: string;
  tempo_estimado_minutos?: number;
  tempo_gasto_minutos: number;
  iniciado_em?: string;
  concluido_em?: string;
  foco_atual: boolean;
  prazo_data?: string;
  prazo_hora?: string;
  prazo_local?: string;
  branch_git?: string;
  commit_git?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface LinkBloco {
  id: string;
  usuario_id: string;
  bloco_id: string;
  titulo: string;
  url: string;
  ordem: number;
  criado_em: string;
}

export interface ChecklistItem {
  id: string;
  usuario_id: string;
  task_id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
  criado_em: string;
}

export interface Desvio {
  id: string;
  usuario_id: string;
  texto: string;
  origem_texto?: string;
  origem_task_id?: string;
  tag?: string;
  concluido: boolean;
  criado_em: string;
}

export interface Anotacao {
  id: string;
  usuario_id: string;
  bloco_id: string;
  titulo: string;
  conteudo: string;
  criado_em: string;
  atualizado_em: string;
}

export interface EventoCalendario {
  id: string;
  usuario_id: string;
  bloco_id?: string;
  titulo: string;
  data: string;
  hora?: string;
  tipo: "Work Blocks" | "Personal Sanctuary" | "Future Ideas";
  cor: string;
  origem: "manual" | "automatico_prazo_task";
  google_event_id?: string;
  sincronizado_em?: string;
  criado_em: string;
}

export interface IntegracaoGoogleAgenda {
  id: string;
  usuario_id: string;
  email_google?: string;
  calendario_google_id?: string;
  conectado_em: string;
  ativo: boolean;
  // access_token e refresh_token NÃO são expostos ao cliente
}

export interface IdeiaFutura {
  id: string;
  usuario_id: string;
  titulo: string;
  descricao: string;
  imagem_url?: string;
  tag?: string;
  criado_em: string;
}

export interface Pensamento {
  id: string;
  usuario_id: string;
  titulo: string;
  detalhes?: string;
  categoria: "ideia" | "tarefa" | "nota";
  triado: boolean;
  destino_tipo?: string;
  destino_id?: string;
  criado_em: string;
}

export interface EventoRotina {
  id: string;
  dia: number;
  inicio_minutos: number;
  fim_minutos: number;
  titulo: string;
  cor: string;
  semana_inicio?: string;
  google_event_id?: string;
  origem?: "manual" | "google";
  categoria_rotina?: "evento" | "tarefa" | "agendamento";
  calendario_event_id?: string;
  convidados?: string[];
  videoconferencia_ativa?: boolean;
  meet_url?: string;
  local?: string;
  descricao?: string;
  anexo_url?: string;
  repeticao?: string;
  prazo_data?: string;
  lista_tarefa?: string;
  disponibilidade?: "ocupado" | "livre";
  visibilidade?: "padrao" | "particular" | "publico";
  notificacao_minutos?: number;
}

export interface ConfiguracaoUsuario {
  usuario_id: string;
  limiar_hiperfoco_percentual: number;
  horario_inicio_dia: string;
  horario_fim_dia: string;
  intervalo_rotina_minutos: number;
  tags_rotina_semanal: Record<string, { nome: string; cor: string }>;
  eventos_rotina_semanal?: EventoRotina[];
  estimativa_ia_ativa: boolean;
  campo_energia_estimada_visivel: boolean;
  campo_contexto_visivel: boolean;
  campo_prioridade_numerica_visivel: boolean;
  modulo_diario_visual_ativo: boolean;
  modulo_rastreador_habitos_ativo: boolean;
  duracao_pomodoro_minutos: number;
  duracao_pausa_curta_minutos: number;
  duracao_pausa_longa_minutos: number;
  pomodoros_ate_pausa_longa: number;
  modo_continuo_ativo: boolean;
  // Tema e acessibilidade
  tema: "claro" | "escuro" | "alto_contraste" | "noturno_ultra_suave";
  lembretes_transicao_ativo: boolean;
  poucas_cores_pouco_texto_ativo: boolean;
  reduzir_animacoes_ativo: boolean;
  som_recompensa_ativo: boolean;
  inicio_automatico_pausa_ativo: boolean;
  modo_preto_branco_ativo: boolean;
  fundo_pomodoro_tipo?: "padrao" | "cor" | "imagem";
  fundo_pomodoro_cor?: string;
  atualizado_em: string;
}

export interface PerfilUsuario {
  id: string;
  primeiro_nome: string | null;
  sobrenome: string | null;
  avatar_url: string | null;
  neurodivergente: boolean;
  neurodivergencias: string[];
  ajuda_visualizada: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface BlocoDoDia {
  id: string;
  usuario_id: string;
  bloco_id: string;
  data: string;
  prioridade: "urgente" | "bloqueadora" | "importante" | null;
  ordem: number;
  concluido: boolean;
  criado_em: string;
}

export interface DataImportante {
  id: string;
  usuario_id: string;
  bloco_id: string;
  titulo: string;
  descricao?: string;
  data: string;
  lida: boolean;
  criado_em: string;
}

