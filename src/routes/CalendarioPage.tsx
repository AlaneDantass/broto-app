import React, { useState } from "react";
import { useEventosCalendario } from "../hooks/useEventosCalendario";
import { Card, EventoModal, SkeletonLoader, EventCountdownSection } from "../components";
import { RoutineGrid } from "../components/RoutineGrid";
import { useLanguage } from "../contexts/LanguageContext";
import type { EventoCalendario } from "../types/database";
interface ColorPreset {
  id: string;
  color: string;
  label: string;
}

export const CalendarioPage: React.FC = () => {
  const { t } = useLanguage();
  const { loading, error, getEventosDoDia, createEvento, updateEvento, deleteEvento } =
    useEventosCalendario();

  const [viewType, setViewType] = useState<"day" | "week" | "month">("month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvento, setSelectedEvento] = useState<EventoCalendario | undefined>(undefined);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const ano = currentDate.getFullYear();
  const mes = currentDate.getMonth();
  const diaAtual = currentDate.getDate();

  // Dias do mês
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasDoMes = ultimoDia.getDate();
  const primeiroFinDeSemana = primeiroDia.getDay();

  // Grid de dias
  const dias = [];
  for (let i = 0; i < primeiroFinDeSemana; i++) {
    dias.push(null);
  }
  for (let i = 1; i <= diasDoMes; i++) {
    dias.push(i);
  }

  const handlePrev = () => {
    if (viewType === "month") setCurrentDate(new Date(ano, mes - 1, 1));
    else if (viewType === "week") setCurrentDate(new Date(ano, mes, diaAtual - 7));
    else setCurrentDate(new Date(ano, mes, diaAtual - 1));
  };

  const handleNext = () => {
    if (viewType === "month") setCurrentDate(new Date(ano, mes + 1, 1));
    else if (viewType === "week") setCurrentDate(new Date(ano, mes, diaAtual + 7));
    else setCurrentDate(new Date(ano, mes, diaAtual + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };



  const mesesTraduzidos = [
    t("calendar.january"), t("calendar.february"), t("calendar.march"), t("calendar.april"),
    t("calendar.may"), t("calendar.june"), t("calendar.july"), t("calendar.august"),
    t("calendar.september"), t("calendar.october"), t("calendar.november"), t("calendar.december")
  ];
  const diasSemanaTraduzidos = [
    t("calendar.sun"), t("calendar.mon"), t("calendar.tue"), t("calendar.wed"),
    t("calendar.thu"), t("calendar.fri"), t("calendar.sat")
  ];

  const getActivePresets = (): ColorPreset[] => {
    const saved = localStorage.getItem("broto_calendar_presets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: "1", color: "#E76F51", label: t("calendar.presetExams") },
      { id: "2", color: "#2A9D8F", label: t("calendar.presetJobs") },
      { id: "3", color: "#457B9D", label: t("calendar.presetStudies") },
      { id: "4", color: "#8338EC", label: t("calendar.presetLeisure") },
      { id: "5", color: "#F15BB5", label: t("calendar.presetPersonal") }
    ];
  };

  const handleCellClick = (dataStr: string) => {
    if (!dataStr) return;
    setSelectedDate(dataStr);
    setSelectedEvento(undefined);
    setIsModalOpen(true);
  };

  const handleEventClick = (evento: EventoCalendario) => {
    setSelectedEvento(evento);
    setSelectedDate(evento.data);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: Omit<EventoCalendario, "id" | "usuario_id" | "criado_em">) => {
    try {
      if (selectedEvento) {
        await updateEvento(selectedEvento.id, data);
      } else {
        await createEvento(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalDelete = async (id: string) => {
    try {
      await deleteEvento(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-surface-variant rounded w-48 animate-pulse" />
            <div className="h-5 bg-surface-variant rounded w-64 animate-pulse" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-variant rounded w-20 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-variant rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Generate days based on viewType
  let diasView: { d: number | null, dataStr: string }[] = [];
  let headerDays: string[] = diasSemanaTraduzidos;

  if (viewType === "month") {
    for (let i = 0; i < primeiroFinDeSemana; i++) {
      diasView.push({ d: null, dataStr: "" });
    }
    for (let i = 1; i <= diasDoMes; i++) {
      diasView.push({ 
        d: i, 
        dataStr: `${ano}-${String(mes + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}` 
      });
    }
  } else if (viewType === "week") {
    const dayOfWeek = currentDate.getDay();
    const firstDayOfWeek = new Date(ano, mes, diaAtual - dayOfWeek);
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek);
      d.setDate(d.getDate() + i);
      diasView.push({
        d: d.getDate(),
        dataStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      });
    }
  } else if (viewType === "day") {
    headerDays = [diasSemanaTraduzidos[currentDate.getDay()]];
    diasView.push({
      d: diaAtual,
      dataStr: `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaAtual).padStart(2, "0")}`
    });
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md text-on-surface mb-0.5 font-playfair">
            {t("calendar.title")}
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            {t("calendar.subtitle")}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <p className="text-body-md text-error">{error}</p>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-sm text-on-surface font-playfair min-w-[150px]">
            {viewType === "day" 
              ? `${diaAtual} ${mesesTraduzidos[mes]} ${ano}`
              : `${mesesTraduzidos[mes]} ${ano}`
            }
          </h2>
          <div className="flex bg-surface-variant rounded-lg p-1">
            <button
              onClick={() => setViewType("day")}
              className={`px-3 py-1 text-label-sm rounded-md transition-colors ${viewType === "day" ? "bg-surface shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewType("week")}
              className={`px-3 py-1 text-label-sm rounded-md transition-colors ${viewType === "week" ? "bg-surface shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewType("month")}
              className={`px-3 py-1 text-label-sm rounded-md transition-colors ${viewType === "month" ? "bg-surface shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Mês
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="px-3 py-1.5 bg-surface-variant hover:bg-surface-variant-high rounded-lg text-label-md transition-colors"
          >
            {t("calendar.prev")}
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-md hover:bg-primary-container transition-colors"
          >
            {t("calendar.today")}
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 bg-surface-variant hover:bg-surface-variant-high rounded-lg text-label-md transition-colors"
          >
            {t("calendar.next")}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-surface-variant rounded-lg overflow-hidden border border-outline-variant">
        {/* Dias da semana */}
        <div className={`grid ${viewType === 'day' ? 'grid-cols-1' : 'grid-cols-7'} bg-surface-variant-high`}>
          {headerDays.map((dia) => (
            <div
              key={dia}
              className="py-2 text-center text-label-sm font-semibold text-on-surface-variant border-b border-outline-variant"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className={`grid ${viewType === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
          {diasView.map((diaObj, idx) => {
            const { d, dataStr } = diaObj;
            
            let isToday = false;
            if (dataStr) {
              const [y, m, day] = dataStr.split("-").map(Number);
              isToday = day === today.getDate() && (m - 1) === today.getMonth() && y === today.getFullYear();
            }

            const eventosDoDia = dataStr ? getEventosDoDia(dataStr) : [];

            return (
              <div
                key={idx}
                onClick={() => d && handleCellClick(dataStr)}
                className={`${viewType === "month" ? "h-[86px]" : "h-[154px]"} p-1 border-r border-b border-outline-variant flex flex-col justify-between transition-colors ${
                  !d
                    ? "bg-surface-variant-low"
                    : isToday
                    ? "bg-primary-container/20 hover:bg-primary-container/30 cursor-pointer"
                    : "bg-surface hover:bg-surface-variant-low cursor-pointer"
                }`}
              >
                {d ? (
                  <>
                    <div
                      className={`text-label-xs font-bold leading-none self-start ${
                        isToday ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {d}
                    </div>
                    <div className="space-y-0.5 overflow-hidden flex-1 mt-1 flex flex-col justify-end">
                      {eventosDoDia.slice(0, 2).map((evento) => (
                        <button
                          key={evento.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(evento);
                          }}
                          className="w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate hover:opacity-85 transition-opacity"
                          style={{ backgroundColor: evento.cor || "#808080" }}
                        >
                          {evento.hora ? (
                            <span className="font-semibold mr-0.5">
                              {evento.hora.slice(0, 5)}
                            </span>
                          ) : null}
                          {evento.titulo}
                        </button>
                      ))}
                      {eventosDoDia.length > 2 && (
                        <div className="text-[9px] font-medium text-on-surface-variant px-1 leading-none">
                          +{eventosDoDia.length - 2} {t("calendar.more")}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 bg-surface-variant rounded-lg border border-outline-variant px-4">
        <span className="text-label-sm font-semibold text-on-surface-variant mr-1">
          {t("calendar.eventTypes")}:
        </span>
        {getActivePresets().map((preset) => (
          <div key={preset.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ backgroundColor: preset.color }}
            />
            <span className="text-label-sm text-on-surface-variant">
              {preset.label}
            </span>
          </div>
        ))}
      </div>

      <RoutineGrid />

      <EventCountdownSection />

      <EventoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
        initialData={selectedEvento || ({ data: selectedDate } as any)}
      />
    </div>
  );
};
