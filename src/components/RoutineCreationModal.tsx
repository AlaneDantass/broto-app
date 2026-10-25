import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Users,
  Video,
  MapPin,
  AlignLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  List,
  Info,
  Trash2,
  Edit2,
  Check,
  Plus,
  Paperclip,
  GripHorizontal,
} from "lucide-react";
import type { EventoRotina } from "../types/database";
import { useLanguage } from "../contexts/LanguageContext";
import { useSensorial } from "../contexts/SensorialContext";
import { usePerfil } from "../hooks/usePerfil";
import { useAuth } from "../contexts/AuthContext";
import {
  PASTEL_SWATCHES,
  PASTEL_GREEN_UNIFIED,
  getPastelStyle,
} from "../utils/pastelColors";

interface ColorPreset {
  id: string;
  color: string;
  label: string;
}

const LOCAL_STORAGE_KEY = "broto_calendar_presets";
const GOOGLE_AGENDA_WEEK_URL = "https://calendar.google.com/calendar/u/0/r/week";

interface RoutineCreationModalProps {
  editingEvent: Partial<EventoRotina>;
  setEditingEvent: React.Dispatch<React.SetStateAction<Partial<EventoRotina> | null>>;
  selectedDateObj: Date;
  startTimeMin: number;
  interval: number;
  snapMinutes: number;
  formatMinToTime: (min: number) => string;
  parseTime: (str: string) => number;
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  emailGoogle?: string | null;
}

const openExternalUrl = async (url: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opener = await import("@tauri-apps/plugin-opener" as any);
    await opener.open(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export const RoutineCreationModal: React.FC<RoutineCreationModalProps> = ({
  editingEvent,
  setEditingEvent,
  selectedDateObj,
  startTimeMin,
  interval,
  snapMinutes,
  formatMinToTime,
  parseTime,
  onSave,
  onDelete,
  emailGoogle,
}) => {
  const { t, language } = useLanguage();
  const { poucasCoresAtivo } = useSensorial();
  const { perfil } = usePerfil();
  const { user } = useAuth();

  const activeTab = editingEvent.categoria_rotina || "evento";

  const setActiveTab = (tab: "evento" | "tarefa" | "agendamento") => {
    setEditingEvent((prev) => (prev ? { ...prev, categoria_rotina: tab } : prev));
  };

  // Nome do usuário exibido na linha do calendário (idêntico às fotos do Google Agenda)
  const displayUserName = (() => {
    if (perfil?.primeiro_nome) {
      return [perfil.primeiro_nome, perfil.sobrenome].filter(Boolean).join(" ");
    }
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (emailGoogle) return emailGoogle.split("@")[0];
    if (user?.email) return user.email.split("@")[0];
    return "Meu Calendário";
  })();

  // Data formatada estilo Google Agenda: "Sábado, 31 de outubro"
  const formattedDayLabel = (() => {
    const weekday = selectedDateObj.toLocaleDateString("pt-BR", { weekday: "long" });
    const dayNum = selectedDateObj.getDate();
    const monthName = selectedDateObj.toLocaleDateString("pt-BR", { month: "long" });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${dayNum} de ${monthName}`;
  })();

  // Classificações / Presets de cor compartilhados com a seção "Calendário"
  const [presets, setPresets] = useState<ColorPreset[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "1", color: "#E76F51", label: language === "en" ? "Exams" : "Provas" },
      { id: "2", color: "#2A9D8F", label: language === "en" ? "Work" : "Trabalhos" },
      { id: "3", color: "#457B9D", label: language === "en" ? "Studies" : "Estudos" },
      { id: "4", color: "#8338EC", label: language === "en" ? "Leisure" : "Lazer" },
      { id: "5", color: "#F15BB5", label: language === "en" ? "Personal" : "Pessoal" },
    ];
  });

  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetColor, setEditingPresetColor] = useState("");
  const [editingPresetLabel, setEditingPresetLabel] = useState("");
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetColor, setNewPresetColor] = useState("#457B9D");
  const [newPresetLabel, setNewPresetLabel] = useState("");

  // Estado local para adicionar convidado
  const [guestInput, setGuestInput] = useState("");
  const [showAttachmentInput, setShowAttachmentInput] = useState(
    Boolean(editingEvent.anexo_url)
  );
  const [showColorSection, setShowColorSection] = useState(false);

  useEffect(() => {
    // Se estiver criando um novo "evento" e a cor atual não estiver nas classificações, usa a primeira classificação
    if (!editingEvent.id && activeTab === "evento" && presets.length > 0 && !editingEvent.cor) {
      setEditingEvent((prev) => (prev ? { ...prev, cor: presets[0].color } : prev));
    }
  }, [activeTab, editingEvent.id, editingEvent.cor, presets, setEditingEvent]);

  const savePresetsToStorage = (updated: ColorPreset[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setPresets(updated);
  };

  const handleCreatePreset = () => {
    if (!newPresetLabel.trim()) return;
    const newPreset: ColorPreset = {
      id: Math.random().toString(36).substring(7),
      color: newPresetColor,
      label: newPresetLabel.trim(),
    };
    const updated = [...presets, newPreset];
    savePresetsToStorage(updated);
    setEditingEvent((prev) => (prev ? { ...prev, cor: newPreset.color } : prev));
    setIsAddingPreset(false);
    setNewPresetLabel("");
  };

  const handleSavePreset = (id: string) => {
    if (!editingPresetLabel.trim()) return;
    const updated = presets.map((p) =>
      p.id === id
        ? { ...p, color: editingPresetColor, label: editingPresetLabel.trim() }
        : p
    );
    savePresetsToStorage(updated);
    setEditingPresetId(null);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    savePresetsToStorage(updated);
  };

  const handleAddGuest = () => {
    const trimmed = guestInput.trim();
    if (!trimmed) return;
    const currentGuests = editingEvent.convidados || [];
    if (!currentGuests.includes(trimmed)) {
      setEditingEvent({
        ...editingEvent,
        convidados: [...currentGuests, trimmed],
      });
    }
    setGuestInput("");
  };

  const handleRemoveGuest = (guest: string) => {
    const currentGuests = editingEvent.convidados || [];
    setEditingEvent({
      ...editingEvent,
      convidados: currentGuests.filter((g) => g !== guest),
    });
  };

  const handleConfigureAppointment = async () => {
    await openExternalUrl(GOOGLE_AGENDA_WEEK_URL);
    setEditingEvent(null);
  };

  const currentStartVal = formatMinToTime(editingEvent.inicio_minutos ?? startTimeMin);
  const currentEndVal = formatMinToTime(
    (editingEvent.fim_minutos ?? startTimeMin) + interval
  );

  const handleStartTimeChange = (val: string) => {
    if (!val) return;
    const newStart = parseTime(val);
    const currentEndClock = (editingEvent.fim_minutos ?? startTimeMin) + interval;
    const nextEndClock =
      currentEndClock <= newStart ? newStart + interval : currentEndClock;
    setEditingEvent({
      ...editingEvent,
      inicio_minutos: newStart,
      fim_minutos: nextEndClock - interval,
    });
  };

  const handleEndTimeChange = (val: string) => {
    if (!val) return;
    const newEndClock = parseTime(val);
    const currentStart = editingEvent.inicio_minutos ?? startTimeMin;
    const clampedEndClock = Math.max(currentStart + snapMinutes, newEndClock);
    setEditingEvent({
      ...editingEvent,
      fim_minutos: clampedEndClock - interval,
    });
  };

  const currentColorStyle = getPastelStyle(
    editingEvent.cor || presets[0]?.color || PASTEL_SWATCHES[0],
    poucasCoresAtivo
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 animate-in fade-in"
      onMouseDown={() => setEditingEvent(null)}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-[460px] max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top bar estilo Google Calendar (handle + botão fechar) */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <GripHorizontal size={18} className="text-on-surface-variant/60" />
          <button
            type="button"
            onClick={() => setEditingEvent(null)}
            className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="px-6 pb-4 overflow-y-auto space-y-4 flex-1">
          {/* Input "Adicionar título" e Abas */}
          <div className="pl-9">
            <input
              type="text"
              value={editingEvent.titulo || ""}
              onChange={(e) =>
                setEditingEvent({ ...editingEvent, titulo: e.target.value })
              }
              placeholder="Adicionar título"
              className="w-full pb-1.5 bg-transparent border-b-2 border-outline-variant focus:border-[#0b57d0] text-[22px] text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none transition-colors"
              autoFocus
            />

            {/* 3 Abas: Evento | Tarefa | Agendamento de horários [Novo] */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => setActiveTab("evento")}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  activeTab === "evento"
                    ? poucasCoresAtivo
                      ? "bg-[#DCEFE0] text-[#234829]"
                      : "bg-[#c2e7ff] text-[#001d35]"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                Evento
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tarefa")}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  activeTab === "tarefa"
                    ? poucasCoresAtivo
                      ? "bg-[#DCEFE0] text-[#234829]"
                      : "bg-[#c2e7ff] text-[#001d35]"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                Tarefa
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("agendamento")}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === "agendamento"
                    ? poucasCoresAtivo
                      ? "bg-[#DCEFE0] text-[#234829]"
                      : "bg-[#c2e7ff] text-[#001d35]"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span>Agendamento de horários</span>
                {!poucasCoresAtivo && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#0b57d0] text-white rounded-full leading-none">
                    Novo
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Linha de Data e Horário (sempre visível em todas as abas, inclusive em Poucas Cores) */}
          {activeTab === "agendamento" ? (
            <div className="flex items-start gap-4 pt-1">
              <Clock size={18} className="text-on-surface-variant mt-2.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="inline-block px-3.5 py-2 rounded-lg bg-surface-container-high text-body-sm text-on-surface">
                  {formattedDayLabel}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    step={900}
                    value={currentStartVal}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-surface-container-high text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-on-surface-variant">–</span>
                  <input
                    type="time"
                    step={900}
                    value={currentEndVal}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-surface-container-high text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 pt-1">
              <Clock size={18} className="text-on-surface-variant mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface">
                  <span>{formattedDayLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      step={900}
                      value={currentStartVal}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="px-2 py-1 bg-surface-container rounded-md border border-outline-variant text-body-sm text-on-surface focus:border-primary focus:outline-none"
                    />
                    <span className="text-on-surface-variant">–</span>
                    <input
                      type="time"
                      step={900}
                      value={currentEndVal}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="px-2 py-1 bg-surface-container rounded-md border border-outline-variant text-body-sm text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subtexto Fuso horário / Repetição (oculto em Poucas Cores e Pouco Texto) */}
                {!poucasCoresAtivo && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
                    {activeTab === "evento" && <span>Fuso horário •</span>}
                    <select
                      value={editingEvent.repeticao || "nao_repete"}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, repeticao: e.target.value })
                      }
                      className="bg-transparent text-xs text-on-surface-variant hover:text-on-surface cursor-pointer focus:outline-none"
                    >
                      <option value="nao_repete">Não se repete</option>
                      <option value="diariamente">Todos os dias</option>
                      <option value="semanalmente">Semanalmente</option>
                      <option value="mensalmente">Mensalmente</option>
                      <option value="anualmente">Anualmente</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             CAMPOS EXTRAS QUANDO "POUCAS CORES E POUCO TEXTO" ESTIVER DESATIVADO
             ═══════════════════════════════════════════════════════════════════ */}
          {!poucasCoresAtivo && activeTab === "evento" && (
            <div className="space-y-3.5 pt-1">
              {/* Convidados */}
              <div className="flex items-start gap-4">
                <Users size={18} className="text-on-surface-variant mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={guestInput}
                      onChange={(e) => setGuestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddGuest();
                        }
                      }}
                      placeholder="Adicionar convidados"
                      className="flex-1 px-2.5 py-1.5 bg-transparent hover:bg-surface-container focus:bg-surface-container rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-colors"
                    />
                    {guestInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddGuest}
                        className="px-2.5 py-1 text-xs font-medium bg-primary text-on-primary rounded-md"
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                  {editingEvent.convidados && editingEvent.convidados.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
                      {editingEvent.convidados.map((guest) => (
                        <span
                          key={guest}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-surface-container-high text-on-surface border border-outline-variant"
                        >
                          <span className="truncate max-w-[180px]">{guest}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGuest(guest)}
                            className="text-on-surface-variant hover:text-error"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Google Meet */}
              <div className="flex items-center gap-4">
                <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-[#fbbc04]/20 text-[#1a73e8] flex-shrink-0">
                  <Video size={15} className="text-[#00897b]" />
                </div>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingEvent({
                        ...editingEvent,
                        videoconferencia_ativa: !editingEvent.videoconferencia_ativa,
                      })
                    }
                    className={`text-body-sm text-left px-2.5 py-1.5 rounded-lg transition-colors flex-1 ${
                      editingEvent.videoconferencia_ativa
                        ? "bg-[#e8f0fe] text-[#1967d2] font-medium"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {editingEvent.videoconferencia_ativa
                      ? "Videoconferência do Google Meet adicionada"
                      : "Adicionar videoconferência do Google Meet"}
                  </button>
                  {editingEvent.videoconferencia_ativa && (
                    <button
                      type="button"
                      onClick={() => openExternalUrl("https://meet.google.com/new")}
                      className="text-xs text-[#0b57d0] hover:underline flex-shrink-0"
                    >
                      Abrir Meet
                    </button>
                  )}
                </div>
              </div>

              {/* Local */}
              <div className="flex items-center gap-4">
                <MapPin size={18} className="text-on-surface-variant flex-shrink-0" />
                <input
                  type="text"
                  value={editingEvent.local || ""}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, local: e.target.value })
                  }
                  placeholder="Adicionar local"
                  className="flex-1 px-2.5 py-1.5 bg-transparent hover:bg-surface-container focus:bg-surface-container rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-colors"
                />
              </div>

              {/* Descrição ou Anexo do Google Drive */}
              <div className="flex items-start gap-4">
                <AlignLeft size={18} className="text-on-surface-variant mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={editingEvent.descricao || ""}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, descricao: e.target.value })
                    }
                    placeholder="Adicionar descrição ou um anexo do Google Drive"
                    className="w-full px-2.5 py-1.5 bg-transparent hover:bg-surface-container focus:bg-surface-container rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none resize-none transition-colors"
                  />
                  {showAttachmentInput || editingEvent.anexo_url ? (
                    <div className="flex items-center gap-2 px-2">
                      <Paperclip size={14} className="text-on-surface-variant flex-shrink-0" />
                      <input
                        type="url"
                        value={editingEvent.anexo_url || ""}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, anexo_url: e.target.value })
                        }
                        placeholder="Cole o link do arquivo no Google Drive..."
                        className="flex-1 text-xs py-1 px-2 bg-surface-container rounded border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition-colors"
                    >
                      <Paperclip size={13} />
                      <span>Anexar link do Google Drive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Linha do Usuário + Ocupado / Visibilidade / Notificação + Seletor de Cor e Classificação */}
              <div className="space-y-3 pt-1 border-t border-outline-variant/60">
                <div className="flex items-start gap-4">
                  <CalendarIcon
                    size={18}
                    className="text-on-surface-variant mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm text-on-surface truncate">
                        {displayUserName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowColorSection((prev) => !prev)}
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-black/15 transition-transform hover:scale-110"
                        style={{ backgroundColor: currentColorStyle.swatch }}
                        title="Escolher cor e classificação"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                      <select
                        value={editingEvent.disponibilidade || "ocupado"}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            disponibilidade: e.target.value as "ocupado" | "livre",
                          })
                        }
                        className="bg-transparent hover:text-on-surface cursor-pointer focus:outline-none"
                      >
                        <option value="ocupado">Ocupado</option>
                        <option value="livre">Livre</option>
                      </select>
                      <span>•</span>
                      <select
                        value={editingEvent.visibilidade || "padrao"}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            visibilidade: e.target.value as
                              | "padrao"
                              | "particular"
                              | "publico",
                          })
                        }
                        className="bg-transparent hover:text-on-surface cursor-pointer focus:outline-none"
                      >
                        <option value="padrao">Visibilidade padrão</option>
                        <option value="particular">Particular</option>
                        <option value="publico">Público</option>
                      </select>
                      <span>•</span>
                      <select
                        value={editingEvent.notificacao_minutos ?? 30}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            notificacao_minutos: Number(e.target.value),
                          })
                        }
                        className="bg-transparent hover:text-on-surface cursor-pointer focus:outline-none"
                      >
                        <option value={10}>Notificar 10 minutos antes</option>
                        <option value={30}>Notificar 30 minutos antes</option>
                        <option value={60}>Notificar 1 hora antes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mesmas opções de Cor e Classificação da seção "Calendário" */}
                <div className="pl-8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm text-on-surface-variant">
                      {t("calendar.eventColor")} / Classificação (salva no Calendário)
                    </span>
                  </div>

                  {/* Lista de Classificações (Presets do Calendário) */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {presets.map((preset) => {
                      const isEditing = editingPresetId === preset.id;
                      const isSelected =
                        (editingEvent.cor || "").toLowerCase() ===
                        preset.color.toLowerCase();
                      const presetPastel = getPastelStyle(preset.color, false);

                      return (
                        <div
                          key={preset.id}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border transition-colors ${
                            isSelected
                              ? "bg-surface-container border-primary/50"
                              : "bg-surface-container-low border-outline-variant"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex flex-1 items-center gap-2">
                              <input
                                type="color"
                                value={editingPresetColor}
                                onChange={(e) => setEditingPresetColor(e.target.value)}
                                className="w-7 h-7 rounded cursor-pointer border border-outline-variant p-0"
                              />
                              <input
                                type="text"
                                value={editingPresetLabel}
                                onChange={(e) => setEditingPresetLabel(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 text-body-sm bg-surface border border-outline rounded focus:outline-none"
                                placeholder={t("calendar.presetLabelPlaceholder")}
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePreset(preset.id)}
                                className="p-1 text-primary hover:bg-primary-container rounded flex-shrink-0"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPresetId(null)}
                                className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded flex-shrink-0"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingEvent({ ...editingEvent, cor: preset.color })
                                }
                                className={`flex items-center gap-2 flex-1 text-left ${
                                  isSelected ? "font-semibold" : ""
                                }`}
                              >
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-on-surface border border-black/10 flex-shrink-0"
                                  style={{ backgroundColor: presetPastel.swatch }}
                                >
                                  {isSelected && <Check size={12} />}
                                </span>
                                <span className="text-body-sm text-on-surface truncate">
                                  {preset.label}
                                </span>
                              </button>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPresetId(preset.id);
                                    setEditingPresetColor(preset.color);
                                    setEditingPresetLabel(preset.label);
                                  }}
                                  className="p-1 text-on-surface-variant hover:text-on-surface rounded"
                                  title={t("calendar.editPreset")}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePreset(preset.id)}
                                  className="p-1 text-on-surface-variant hover:text-error rounded"
                                  title={t("calendar.deletePresetConfirm")}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Adicionar nova classificação */}
                  {isAddingPreset ? (
                    <div className="flex items-center gap-2 p-1.5 bg-surface-container rounded-lg border border-outline-variant">
                      <input
                        type="color"
                        value={newPresetColor}
                        onChange={(e) => setNewPresetColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-outline-variant p-0"
                      />
                      <input
                        type="text"
                        value={newPresetLabel}
                        onChange={(e) => setNewPresetLabel(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 text-body-sm bg-surface border border-outline rounded focus:outline-none"
                        placeholder={t("calendar.presetLabelPlaceholder")}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreatePreset}
                        disabled={!newPresetLabel.trim()}
                        className="p-1 text-primary hover:bg-primary-container rounded flex-shrink-0 disabled:opacity-50"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingPreset(false)}
                        className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded flex-shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPreset(true);
                        setNewPresetColor("#457B9D");
                        setNewPresetLabel("");
                      }}
                      className="w-full py-1 px-3 border border-dashed border-outline hover:bg-surface-container-low rounded-lg text-xs text-on-surface-variant transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} />
                      <span>{t("calendar.addPreset")}</span>
                    </button>
                  )}

                  {/* Seletor de cor customizada / tons pastéis */}
                  <div className="flex items-center justify-between gap-3 p-2 bg-surface-container-low rounded-lg border border-outline-variant">
                    <span className="text-xs text-on-surface-variant">
                      {t("calendar.customColor")}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PASTEL_SWATCHES.slice(0, 6).map((c) => {
                        const sw = getPastelStyle(c, false);
                        const selected =
                          (editingEvent.cor || "").toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditingEvent({ ...editingEvent, cor: c })}
                            className={`w-5 h-5 rounded-full border transition-transform ${
                              selected ? "scale-115 ring-2 ring-primary" : "hover:scale-110"
                            }`}
                            style={{
                              backgroundColor: sw.bg,
                              borderColor: sw.swatch,
                            }}
                          />
                        );
                      })}
                      <input
                        type="color"
                        value={editingEvent.cor || "#E76F51"}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, cor: e.target.value })
                        }
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             ABA 2: TAREFA (Idêntico à Foto 2 do Google Agenda)
             ═══════════════════════════════════════════════════════════════════ */}
          {!poucasCoresAtivo && activeTab === "tarefa" && (
            <div className="space-y-3.5 pt-1">
              {/* Adicionar prazo */}
              <div className="flex items-center gap-4">
                <CheckCircle2 size={18} className="text-on-surface-variant flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-body-sm text-on-surface-variant">
                    Adicionar prazo:
                  </span>
                  <input
                    type="date"
                    value={editingEvent.prazo_data || ""}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, prazo_data: e.target.value })
                    }
                    className="px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Adicionar descrição ou um anexo do Google Drive */}
              <div className="flex items-start gap-4">
                <AlignLeft size={18} className="text-on-surface-variant mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={editingEvent.descricao || ""}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, descricao: e.target.value })
                    }
                    placeholder="Adicionar descrição ou um anexo do Google Drive"
                    className="w-full px-2.5 py-1.5 bg-transparent hover:bg-surface-container focus:bg-surface-container rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none resize-none transition-colors"
                  />
                  {showAttachmentInput || editingEvent.anexo_url ? (
                    <div className="flex items-center gap-2 px-2">
                      <Paperclip size={14} className="text-on-surface-variant flex-shrink-0" />
                      <input
                        type="url"
                        value={editingEvent.anexo_url || ""}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, anexo_url: e.target.value })
                        }
                        placeholder="Cole o link do arquivo no Google Drive..."
                        className="flex-1 text-xs py-1 px-2 bg-surface-container rounded border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition-colors"
                    >
                      <Paperclip size={13} />
                      <span>Anexar link do Google Drive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Seletor "Minhas tarefas" */}
              <div className="flex items-center gap-4">
                <List size={18} className="text-on-surface-variant flex-shrink-0" />
                <select
                  value={editingEvent.lista_tarefa || "Minhas tarefas"}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, lista_tarefa: e.target.value })
                  }
                  className="px-3.5 py-2 rounded-lg bg-surface-container-high text-body-sm text-on-surface border border-outline-variant/60 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Minhas tarefas">Minhas tarefas</option>
                  <option value="Rotina Pessoal">Rotina Pessoal</option>
                  <option value="Estudos">Estudos</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Saúde & Bem-estar">Saúde & Bem-estar</option>
                </select>
              </div>

              {/* Linha do Usuário + Livre • Particular + Tom Pastel da Tarefa */}
              <div className="flex items-start gap-4 pt-2 border-t border-outline-variant/60">
                <CalendarIcon
                  size={18}
                  className="text-on-surface-variant mt-1 flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm text-on-surface">
                        {displayUserName}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15"
                        style={{ backgroundColor: currentColorStyle.swatch }}
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Livre • Particular
                    </p>
                  </div>

                  {/* Paleta pastel para a tarefa na rotina */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PASTEL_SWATCHES.map((c) => {
                      const sw = getPastelStyle(c, false);
                      const isSel =
                        (editingEvent.cor || "").toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, cor: c })}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-transform ${
                            isSel
                              ? "ring-2 ring-offset-1 ring-primary scale-110"
                              : "hover:scale-110"
                          }`}
                          style={{
                            backgroundColor: sw.bg,
                            borderColor: sw.swatch,
                          }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sw.swatch }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             ABA 3: AGENDAMENTO DE HORÁRIOS (Idêntico à Foto 3 do Google Agenda)
             ═══════════════════════════════════════════════════════════════════ */}
          {!poucasCoresAtivo && activeTab === "agendamento" && (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest flex items-start gap-3.5">
                <Info size={20} className="text-on-surface-variant mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-body-sm text-on-surface">
                  <p className="leading-relaxed">
                    Crie uma página de agendamento para compartilhar com outras
                    pessoas e permitir que elas marquem um horário com você.
                  </p>
                  <div className="flex items-center gap-5 pt-1">
                    <button
                      type="button"
                      onClick={() => openExternalUrl(GOOGLE_AGENDA_WEEK_URL)}
                      className="text-[#0b57d0] hover:underline font-medium text-xs"
                    >
                      Veja como funciona
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openExternalUrl(
                          "https://support.google.com/calendar/answer/11608416"
                        )
                      }
                      className="text-[#0b57d0] hover:underline font-medium text-xs"
                    >
                      Saiba mais
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/60">
                <CalendarIcon size={18} className="text-on-surface-variant flex-shrink-0" />
                <span className="text-body-sm text-on-surface">{displayUserName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="px-6 py-3.5 bg-surface border-t border-outline-variant/60 flex items-center justify-between gap-3">
          {editingEvent.id ? (
            <button
              type="button"
              onClick={() => onDelete(editingEvent.id!)}
              className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
              title="Excluir atividade"
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <div />
          )}

          {activeTab === "agendamento" ? (
            <button
              type="button"
              onClick={handleConfigureAppointment}
              className={`px-5 py-2.5 rounded-full text-label-md font-medium transition-opacity hover:opacity-90 ${
                poucasCoresAtivo
                  ? "bg-primary text-on-primary"
                  : "bg-[#0b57d0] text-white"
              }`}
            >
              Configurar o compromisso
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {!poucasCoresAtivo && activeTab === "evento" && (
                <button
                  type="button"
                  onClick={() => openExternalUrl(GOOGLE_AGENDA_WEEK_URL)}
                  className="px-3 py-2 text-label-md font-medium text-[#0b57d0] hover:bg-[#0b57d0]/10 rounded-full transition-colors"
                >
                  Mais opções
                </button>
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={!editingEvent.titulo?.trim()}
                className={`px-6 py-2 rounded-full text-label-md font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${
                  poucasCoresAtivo
                    ? "bg-primary text-on-primary"
                    : "bg-[#0b57d0] text-white"
                }`}
              >
                Salvar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
