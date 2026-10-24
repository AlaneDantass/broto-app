import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useConfiguracoes } from "../hooks/useConfiguracoes";
import { useGoogleAgenda } from "../hooks/useGoogleAgenda";
import { useEventosCalendario } from "../hooks/useEventosCalendario";
import {
  Plus,
  X,
  Trash2,
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "./Card";
import type { EventoRotina } from "../types/database";

const COLORS = [
  "#E76F51", "#2A9D8F", "#457B9D", "#8338EC", "#F15BB5", 
  "#F4A261", "#E9C46A", "#264653", "#1D3557", "#D90429"
];

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const formatDateYYYYMMDD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatMinToTime = (totalMin: number) => {
  const normalized = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const formatWeekRange = (start: Date, end: Date) => {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const endMonth = end.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startDay} de ${startMonth} de ${startYear} – ${endDay} de ${endMonth} de ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} de ${startMonth} – ${endDay} de ${endMonth} de ${startYear}`;
  }
  return `${startDay} a ${endDay} de ${startMonth} de ${startYear}`;
};

// Helper para obter as tags da semana ativa, com fallback para formato legado no root na semana atual
const getWeekTags = (
  allTags: any,
  weekStartStr: string,
  isCurrentWeek: boolean
): Record<number, { nome: string; cor: string }> => {
  if (!allTags || typeof allTags !== "object") return {};
  if (allTags[weekStartStr] && typeof allTags[weekStartStr] === "object") {
    return allTags[weekStartStr];
  }
  // Se for a semana atual e existirem chaves legadas no root (0..6)
  if (isCurrentWeek) {
    const legacy: Record<number, { nome: string; cor: string }> = {};
    let foundLegacy = false;
    for (let i = 0; i < 7; i++) {
      if (allTags[i] && allTags[i].nome) {
        legacy[i] = allTags[i];
        foundLegacy = true;
      }
    }
    if (foundLegacy) return legacy;
  }
  return {};
};

export const RoutineGrid: React.FC = () => {
  const { config, updateConfig } = useConfiguracoes();
  const {
    integrado,
    emailGoogle,
    carregando: googleCarregando,
    conectando,
    conectar,
    callSync,
  } = useGoogleAgenda();
  const {
    eventos: eventosCalendario,
    updateEvento,
    deleteEvento,
    pullFromGoogle,
  } = useEventosCalendario();
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(COLORS[0]);

  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ day: number, min: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ day: number, min: number } | null>(null);
  
  const [editingEvent, setEditingEvent] = useState<Partial<EventoRotina> | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  // Minuto atual do dia para a linha em tempo real
  const [currentTimeMin, setCurrentTimeMin] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMin(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const intervalId = setInterval(updateTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const syncingRoutineIdsRef = useRef<Set<string>>(new Set());

  const today = useMemo(() => new Date(), []);
  const todayDayIndex = today.getDay();

  // Início e fim da semana selecionada
  const selectedWeekStart = useMemo(() => {
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - todayDayIndex + weekOffset * 7
    );
  }, [today, todayDayIndex, weekOffset]);

  const selectedWeekEnd = useMemo(() => {
    return new Date(
      selectedWeekStart.getFullYear(),
      selectedWeekStart.getMonth(),
      selectedWeekStart.getDate() + 6
    );
  }, [selectedWeekStart]);

  const selectedWeekStartStr = useMemo(
    () => formatDateYYYYMMDD(selectedWeekStart),
    [selectedWeekStart]
  );

  const getDateForDayIndex = useCallback(
    (dayIndex: number) => {
      return new Date(
        selectedWeekStart.getFullYear(),
        selectedWeekStart.getMonth(),
        selectedWeekStart.getDate() + dayIndex
      );
    },
    [selectedWeekStart]
  );

  const getDateStrForDayIndex = useCallback(
    (dayIndex: number) => {
      return formatDateYYYYMMDD(getDateForDayIndex(dayIndex));
    },
    [getDateForDayIndex]
  );

  // Sincroniza atividades manuais da semana selecionada que ainda não possuem google_event_id quando conectado
  const pushUnsyncedRoutineEvents = useCallback(async () => {
    if (!integrado || !config) return;
    const intervalMin = config.intervalo_rotina_minutos || 60;
    const allEvents = config.eventos_rotina_semanal || [];
    const unsynced = allEvents.filter(
      (e) =>
        e.semana_inicio === selectedWeekStartStr &&
        !e.google_event_id &&
        e.origem !== "google" &&
        !syncingRoutineIdsRef.current.has(e.id)
    );
    if (unsynced.length === 0) return;

    let updatedAny = false;
    const updatedList = [...allEvents];

    for (const ev of unsynced) {
      syncingRoutineIdsRef.current.add(ev.id);
      try {
        const res = await callSync({
          action: "create",
          evento: {
            id: ev.id,
            titulo: ev.titulo,
            data: getDateStrForDayIndex(ev.dia),
            hora: formatMinToTime(ev.inicio_minutos),
            duracao_minutos: ev.fim_minutos - ev.inicio_minutos + intervalMin,
            cor: ev.cor,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.google_event_id) {
            const idx = updatedList.findIndex((item) => item.id === ev.id);
            if (idx !== -1) {
              updatedList[idx] = {
                ...updatedList[idx],
                google_event_id: data.google_event_id,
              };
              updatedAny = true;
            }
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar atividade da rotina com Google:", err);
      } finally {
        syncingRoutineIdsRef.current.delete(ev.id);
      }
    }

    if (updatedAny) {
      await updateConfig({ eventos_rotina_semanal: updatedList });
    }
  }, [integrado, config, selectedWeekStartStr, callSync, getDateStrForDayIndex, updateConfig]);

  useEffect(() => {
    if (integrado) {
      pushUnsyncedRoutineEvents();
    }
  }, [integrado, pushUnsyncedRoutineEvents]);

  const handleSyncGoogle = async () => {
    setSincronizando(true);
    try {
      await pullFromGoogle();
      await pushUnsyncedRoutineEvents();
    } catch (err) {
      console.error("Erro ao sincronizar com Google Agenda:", err);
    } finally {
      setSincronizando(false);
    }
  };

  if (!config) return null;

  const startHourStr = config.horario_inicio_dia || "08:00";
  const endHourStr = config.horario_fim_dia || "18:00";
  const interval = config.intervalo_rotina_minutos || 60;
  
  // Tags isoladas por semana
  const activeTags = getWeekTags(
    config.tags_rotina_semanal,
    selectedWeekStartStr,
    weekOffset === 0
  );

  const allRoutineEvents: EventoRotina[] = config.eventos_rotina_semanal || [];
  const eventos: EventoRotina[] = allRoutineEvents.filter(
    (e) => e.semana_inicio === selectedWeekStartStr
  );

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const startTimeMin = parseTime(startHourStr);
  let endTimeMin = parseTime(endHourStr);
  if (endTimeMin <= startTimeMin) endTimeMin += 24 * 60; 

  const timeSlots: string[] = [];
  for (let current = startTimeMin; current < endTimeMin; current += interval) {
    const h = Math.floor((current % (24 * 60)) / 60);
    const m = current % 60;
    timeSlots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  }

  const handleSaveTag = async () => {
    if (editingDay === null) return;
    const rawAll = { ...(config.tags_rotina_semanal || {}) };
    const currentWeekTags = { ...activeTags };

    if (tagName.trim() === "") {
      delete currentWeekTags[editingDay];
    } else {
      currentWeekTags[editingDay] = { nome: tagName.trim(), cor: tagColor };
    }

    // Se existirem chaves legadas no root (0..6), limpamos para não sobrepor outras semanas
    for (let i = 0; i < 7; i++) {
      delete rawAll[i];
    }

    rawAll[selectedWeekStartStr] = currentWeekTags;

    try {
      await updateConfig({ tags_rotina_semanal: rawAll });
      setEditingDay(null);
    } catch (err) {
      console.error("Erro ao salvar palavra-chave:", err);
    }
  };

  const openTagEditor = (dayIndex: number) => {
    setEditingDay(dayIndex);
    const existing = activeTags[dayIndex];
    if (existing) {
      setTagName(existing.nome);
      setTagColor(existing.cor);
    } else {
      setTagName("");
      setTagColor(COLORS[0]);
    }
  };

  const handleMouseDown = (day: number, min: number, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setIsDragging(true);
      setSelectionStart({ day, min });
      setSelectionCurrent({ day, min });
    } else {
      setIsDragging(true);
      setSelectionStart({ day, min });
      setSelectionCurrent({ day, min });
    }
  };

  const handleMouseEnter = (day: number, min: number) => {
    if (isDragging && selectionStart) {
      if (day === selectionStart.day) {
        setSelectionCurrent({ day, min });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectionStart && selectionCurrent) {
      setIsDragging(false);
      const start = Math.min(selectionStart.min, selectionCurrent.min);
      const end = Math.max(selectionStart.min, selectionCurrent.min);
      
      setEditingEvent({
        dia: selectionStart.day,
        inicio_minutos: start,
        fim_minutos: end,
        titulo: "",
        cor: COLORS[0]
      });
      
      setSelectionStart(null);
      setSelectionCurrent(null);
    }
  };

  const handleSaveEvent = async () => {
    if (!editingEvent || !editingEvent.titulo?.trim()) return;

    // Caso seja um evento importado do calendário/Google (prefixo cal_)
    if (editingEvent.id?.startsWith("cal_")) {
      const calId = editingEvent.id.replace(/^cal_/, "");
      try {
        await updateEvento(calId, {
          titulo: editingEvent.titulo.trim(),
          cor: editingEvent.cor || COLORS[0],
        });
        setEditingEvent(null);
      } catch (err) {
        console.error("Erro ao atualizar evento sincronizado:", err);
      }
      return;
    }

    const isUpdate = Boolean(editingEvent.id);
    const savedEvent: EventoRotina = {
      id:
        editingEvent.id ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15)),
      dia: editingEvent.dia ?? 0,
      inicio_minutos: editingEvent.inicio_minutos ?? startTimeMin,
      fim_minutos: editingEvent.fim_minutos ?? startTimeMin,
      titulo: editingEvent.titulo.trim(),
      cor: editingEvent.cor || COLORS[0],
      semana_inicio: selectedWeekStartStr,
      google_event_id: editingEvent.google_event_id,
      origem: editingEvent.origem || "manual",
    };

    let updatedAllEvents = [...allRoutineEvents];
    if (isUpdate) {
      updatedAllEvents = updatedAllEvents.map((e) => (e.id === savedEvent.id ? savedEvent : e));
    } else {
      updatedAllEvents.push(savedEvent);
    }

    try {
      await updateConfig({ eventos_rotina_semanal: updatedAllEvents });
      setEditingEvent(null);

      // Sincronizar automaticamente com Google Agenda se estiver conectado
      if (integrado) {
        const eventDateStr = getDateStrForDayIndex(savedEvent.dia);
        const startTimeHHMM = formatMinToTime(savedEvent.inicio_minutos);
        const duracaoMin = savedEvent.fim_minutos - savedEvent.inicio_minutos + interval;

        if (isUpdate && savedEvent.google_event_id) {
          callSync({
            action: "update",
            evento: {
              id: savedEvent.id,
              titulo: savedEvent.titulo,
              data: eventDateStr,
              hora: startTimeHHMM,
              duracao_minutos: duracaoMin,
              cor: savedEvent.cor,
              google_event_id: savedEvent.google_event_id,
            },
          }).catch((syncErr) =>
            console.error("Erro ao atualizar atividade no Google Agenda:", syncErr)
          );
        } else if (!isUpdate) {
          syncingRoutineIdsRef.current.add(savedEvent.id);
          callSync({
            action: "create",
            evento: {
              id: savedEvent.id,
              titulo: savedEvent.titulo,
              data: eventDateStr,
              hora: startTimeHHMM,
              duracao_minutos: duracaoMin,
              cor: savedEvent.cor,
            },
          })
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                if (data.google_event_id) {
                  const updatedWithGoogleId = updatedAllEvents.map((e) =>
                    e.id === savedEvent.id
                      ? { ...e, google_event_id: data.google_event_id }
                      : e
                  );
                  await updateConfig({ eventos_rotina_semanal: updatedWithGoogleId });
                }
              }
            })
            .catch((syncErr) =>
              console.error("Erro ao criar atividade no Google Agenda:", syncErr)
            )
            .finally(() => {
              syncingRoutineIdsRef.current.delete(savedEvent.id);
            });
        }
      }
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
      alert("Erro ao salvar: Verifique se a coluna 'eventos_rotina_semanal' existe no banco de dados.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (id.startsWith("cal_")) {
      const calId = id.replace(/^cal_/, "");
      try {
        await deleteEvento(calId);
        setEditingEvent(null);
      } catch (err) {
        console.error("Erro ao remover evento sincronizado:", err);
      }
      return;
    }

    const eventToDelete = allRoutineEvents.find((e) => e.id === id);
    const updatedAllEvents = allRoutineEvents.filter((e) => e.id !== id);
    try {
      await updateConfig({ eventos_rotina_semanal: updatedAllEvents });
      setEditingEvent(null);

      if (integrado && eventToDelete?.google_event_id) {
        callSync({
          action: "delete",
          google_event_id: eventToDelete.google_event_id,
        }).catch((syncErr) =>
          console.error("Erro ao remover atividade do Google Agenda:", syncErr)
        );
      }
    } catch (err) {
      console.error("Erro ao remover evento:", err);
    }
  };

  const openEventEditor = (evento: EventoRotina, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(evento);
  };

  const getTop = (min: number) => ((min - startTimeMin) / interval) * 58;
  const getHeight = (start: number, end: number) => ((end - start + interval) / interval) * 58;

  const renderSelectionForDay = (day: number) => {
    if (!selectionStart || !selectionCurrent || selectionStart.day !== day) return null;
    const start = Math.min(selectionStart.min, selectionCurrent.min);
    const end = Math.max(selectionStart.min, selectionCurrent.min);
    
    return (
      <div 
        className="absolute left-1 right-1 bg-primary/20 border-2 border-primary/50 rounded-md pointer-events-none"
        style={{
          top: `${getTop(start)}px`,
          height: `${getHeight(start, end)}px`,
          zIndex: 5
        }}
      />
    );
  };

  return (
    <Card className="mt-8 flex-1 overflow-hidden flex flex-col">
      {/* Header com Título, Navegação de Semanas e Google Agenda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h2 className="text-headline-sm text-on-surface font-playfair">Quadro de Rotina</h2>

          {/* Controles de Navegação de Semana */}
          <div className="flex items-center gap-2 bg-surface-variant/40 rounded-lg p-1 border border-outline-variant">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 hover:bg-surface rounded text-on-surface-variant hover:text-on-surface transition-colors"
              title="Semana anterior"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-label-sm font-medium text-on-surface px-1 min-w-[130px] sm:min-w-[170px] text-center select-none">
              {formatWeekRange(selectedWeekStart, selectedWeekEnd)}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className={`px-2 py-0.5 text-label-xs font-semibold rounded transition-colors ${
                weekOffset === 0
                  ? "text-on-surface-variant/40 cursor-default"
                  : "bg-primary text-on-primary hover:opacity-90 shadow-xs"
              }`}
              title="Voltar para a semana atual"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 hover:bg-surface rounded text-on-surface-variant hover:text-on-surface transition-colors"
              title="Próxima semana"
              aria-label="Próxima semana"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Botão de Integração com Google Agenda */}
        {integrado ? (
          <button
            type="button"
            onClick={handleSyncGoogle}
            disabled={sincronizando}
            title={
              emailGoogle
                ? `Conectado a ${emailGoogle}. Clique para sincronizar agora.`
                : "Clique para sincronizar atividades do Google Agenda"
            }
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-surface-variant hover:bg-surface-variant-high border border-outline-variant text-on-surface rounded-lg text-label-sm font-medium transition-colors disabled:opacity-50"
          >
            {sincronizando ? (
              <RefreshCw size={15} className="animate-spin text-primary" />
            ) : (
              <CheckCircle2 size={15} className="text-green-600" />
            )}
            <span>
              {sincronizando ? "Sincronizando..." : "Google Agenda Conectado"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={conectar}
            disabled={conectando || googleCarregando}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-surface-variant hover:bg-surface-variant-high border border-outline-variant text-on-surface rounded-lg text-label-sm font-medium transition-colors disabled:opacity-50"
          >
            {conectando ? (
              <Loader2 size={15} className="animate-spin text-primary" />
            ) : (
              <Calendar size={15} className="text-primary" />
            )}
            <span>
              {conectando ? "Conectando..." : "Conectar ao Google Agenda"}
            </span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-outline-variant rounded-lg bg-surface relative select-none">
        <div className="min-w-[800px]">
          {/* Header row with Days and Tags */}
          <div className="flex border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
            <div className="w-16 flex-shrink-0 border-r border-outline-variant" /> 
            {DAYS_OF_WEEK.map((day, index) => {
              const tag = activeTags[index];
              const isToday = weekOffset === 0 && index === todayDayIndex;
              const dayDate = getDateForDayIndex(index);
              const dayNum = dayDate.getDate();

              return (
                <div key={index} className="flex-1 flex flex-col min-w-0 border-r border-outline-variant last:border-r-0 p-2 items-center justify-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <span className={`text-label-sm font-semibold text-center text-on-surface ${isToday ? "font-bold text-primary" : ""}`}>
                      {day} <span className="text-[11px] font-normal text-on-surface-variant">({dayNum})</span>
                    </span>
                    {isToday && (
                      <span
                        className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                        title="Dia atual"
                      />
                    )}
                  </div>
                  
                  {tag ? (
                    <div 
                      onClick={() => openTagEditor(index)}
                      className="group cursor-pointer mx-auto max-w-full inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium truncate bg-opacity-20 hover:bg-opacity-30 transition-all border"
                      style={{ 
                        backgroundColor: `${tag.cor}22`,
                        borderColor: `${tag.cor}44`,
                        color: tag.cor
                      }}
                      title="Editar foco do dia"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.cor }} />
                      <span className="truncate">{tag.nome}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => openTagEditor(index)}
                      className="mx-auto flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary-container transition-all"
                      title="Adicionar foco do dia"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Grid Wrapper */}
          <div 
            className="flex relative" 
            onMouseLeave={handleMouseUp} 
            onMouseUp={handleMouseUp}
          >
            {/* Time labels column */}
            <div className="w-16 flex-shrink-0 border-r border-outline-variant flex flex-col">
              {timeSlots.map((time, i) => (
                <div key={i} className="h-[58px] border-b border-outline-variant p-2 flex items-center justify-end">
                  <span className="text-[10px] font-medium text-on-surface-variant bg-surface px-1">{time}</span>
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {DAYS_OF_WEEK.map((_, dayIndex) => {
              const dateStr = getDateStrForDayIndex(dayIndex);
              const isToday = weekOffset === 0 && dayIndex === todayDayIndex;
              const manualDayEvents = eventos.filter((e) => e.dia === dayIndex);

              // Eventos com horário vindos do Google Agenda / Calendário na data correspondente
              const syncedDayEvents: EventoRotina[] = eventosCalendario
                .filter(
                  (ev) =>
                    ev.data === dateStr &&
                    ev.hora &&
                    ev.hora.trim() !== "" &&
                    !eventos.some(
                      (re) =>
                        (ev.google_event_id && re.google_event_id === ev.google_event_id) ||
                        re.id === ev.id
                    )
                )
                .map((ev) => {
                  const startMin = parseTime(ev.hora!.slice(0, 5));
                  return {
                    id: `cal_${ev.id}`,
                    dia: dayIndex,
                    inicio_minutos: startMin,
                    fim_minutos: startMin,
                    titulo: ev.titulo,
                    cor: ev.cor && ev.cor !== "#808080" ? ev.cor : "#457B9D",
                    semana_inicio: selectedWeekStartStr,
                    google_event_id: ev.google_event_id,
                    origem: "google" as const,
                  };
                });

              const dayEvents = [...manualDayEvents, ...syncedDayEvents];

              // Posição da barra de tempo atual em tempo real (estilo Google Agenda)
              const currentLineTop = ((currentTimeMin - startTimeMin) / interval) * 58;
              const maxGridTop = timeSlots.length * 58;
              const showCurrentTimeLine =
                isToday && currentLineTop >= 0 && currentLineTop <= maxGridTop;
              
              return (
                <div key={dayIndex} className="flex-1 relative border-r border-outline-variant last:border-r-0">
                  {/* Grid Cells (Rows) */}
                  {timeSlots.map((_, timeIdx) => {
                    const cellTimeMin = startTimeMin + timeIdx * interval;
                    return (
                      <div 
                        key={timeIdx} 
                        className="h-[58px] border-b border-outline-variant hover:bg-surface-container-lowest transition-colors cursor-pointer"
                        onMouseDown={(e) => handleMouseDown(dayIndex, cellTimeMin, e)}
                        onMouseEnter={() => handleMouseEnter(dayIndex, cellTimeMin)}
                      />
                    );
                  })}

                  {/* Linha vermelha de tempo atual estilo Google Calendar */}
                  {showCurrentTimeLine && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${currentLineTop}px` }}
                    >
                      {/* Círculo indicador na borda esquerda */}
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px] flex-shrink-0 shadow-sm" />
                      {/* Linha vermelha horizontal atravessando o dia */}
                      <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
                    </div>
                  )}

                  {/* Render Events */}
                  {dayEvents.map(evento => {
                    const top = getTop(evento.inicio_minutos);
                    const height = getHeight(evento.inicio_minutos, evento.fim_minutos);
                    if (top < 0 || top > timeSlots.length * 58) return null;
                    
                    return (
                      <div
                        key={evento.id}
                        onClick={(e) => openEventEditor(evento, e)}
                        className="absolute left-1 right-1 rounded p-1 cursor-pointer overflow-hidden border transition-transform hover:scale-[1.02] shadow-sm flex items-center justify-center"
                        style={{
                          top: `${top + 2}px`,
                          height: `${height - 4}px`,
                          backgroundColor: `${evento.cor}15`,
                          borderColor: `${evento.cor}40`,
                          zIndex: 10
                        }}
                      >
                        <span 
                          className="text-xs font-semibold px-1.5 py-0.5 rounded text-center truncate w-full"
                          style={{ backgroundColor: evento.cor, color: "#fff" }}
                        >
                          {evento.titulo}
                        </span>
                      </div>
                    );
                  })}

                  {/* Render Selection */}
                  {renderSelectionForDay(dayIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tag Editor Modal */}
      {editingDay !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface">Foco do dia - {DAYS_OF_WEEK[editingDay]}</h3>
              <button onClick={() => setEditingDay(null)} className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Palavra-chave (vazio para remover)</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={e => setTagName(e.target.value)}
                  placeholder="Ex: Softs-Skils / Aria / IA eng..."
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-body-md text-on-surface focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setTagColor(c)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                          tagColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditingDay(null)}
                  className="px-4 py-2 text-label-md text-on-surface hover:bg-surface-variant rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTag}
                  className="px-4 py-2 bg-primary text-on-primary text-label-md font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routine Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in" onMouseDown={() => setEditingEvent(null)}>
          <div className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-sm" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface">{editingEvent.id ? "Editar Atividade" : "Nova Atividade"}</h3>
              <button onClick={() => setEditingEvent(null)} className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">O que você fará neste horário?</label>
                <input
                  type="text"
                  value={editingEvent.titulo || ""}
                  onChange={e => setEditingEvent({ ...editingEvent, titulo: e.target.value })}
                  placeholder="Ex: Treino, Reunião, Foco"
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-body-md text-on-surface focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Cor da Atividade</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setEditingEvent({ ...editingEvent, cor: c })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                          editingEvent.cor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                {editingEvent.id ? (
                  <button
                    onClick={() => handleDeleteEvent(editingEvent.id!)}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Excluir atividade"
                  >
                    <Trash2 size={20} />
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 text-label-md text-on-surface hover:bg-surface-variant rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    disabled={!editingEvent.titulo?.trim()}
                    className="px-4 py-2 bg-primary text-on-primary text-label-md font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
