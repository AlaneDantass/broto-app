import React from "react";
import { useEventosCalendario } from "../hooks/useEventosCalendario";
import { useLanguage } from "../contexts/LanguageContext";
import { useSensorial } from "../contexts/SensorialContext";
import { getPastelStyle, PASTEL_GREEN_UNIFIED } from "../utils/pastelColors";
import { Card } from "./Card";
import { Clock, Calendar as CalendarIcon } from "lucide-react";

interface ColorPreset {
  id: string;
  color: string;
  label: string;
}

export const EventCountdownSection: React.FC = () => {
  const { t } = useLanguage();
  const { poucasCoresAtivo } = useSensorial();
  const { eventos, loading } = useEventosCalendario();

  const getActivePresets = (): ColorPreset[] => {
    const saved = localStorage.getItem("broto_calendar_presets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: "1", color: "#E76F51", label: t("calendar.presetExams") || "Provas" },
      { id: "2", color: "#2A9D8F", label: t("calendar.presetJobs") || "Trabalhos" },
      { id: "3", color: "#457B9D", label: t("calendar.presetStudies") || "Estudos" },
      { id: "4", color: "#8338EC", label: t("calendar.presetLeisure") || "Lazer" },
      { id: "5", color: "#F15BB5", label: t("calendar.presetPersonal") || "Pessoal" },
    ];
  };

  const presets = getActivePresets();

  // Calcular dias restantes desconsiderando timezone e horas
  const getDaysRemaining = (dataStr: string): number => {
    const [y, m, d] = dataStr.split("-").map(Number);
    const eventDate = new Date(y, m - 1, d);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = eventDate.getTime() - todayStart.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatEventDate = (dataStr: string, horaStr?: string): string => {
    const [y, m, d] = dataStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayStr = String(d).padStart(2, "0");
    const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

    if (horaStr && horaStr.trim() !== "") {
      return `${dayStr} de ${monthName} às ${horaStr.slice(0, 5)}`;
    }
    return `${dayStr} de ${monthName}`;
  };

  if (loading) {
    return null;
  }

  // Filtrar apenas eventos de hoje em diante
  const futureEvents = eventos.filter((ev) => {
    if (!ev.data) return false;
    const days = getDaysRemaining(ev.data);
    return days >= 0;
  });

  // Agrupar eventos por categoria com base na cor
  const groupedByCategory = presets.map((preset) => {
    const categoryEvents = futureEvents
      .filter((ev) => (ev.cor || "").toUpperCase() === preset.color.toUpperCase())
      .sort((a, b) => {
        const daysA = getDaysRemaining(a.data);
        const daysB = getDaysRemaining(b.data);
        return daysA - daysB;
      });

    return {
      preset,
      events: categoryEvents,
    };
  });

  // Também verificar eventos sem categoria definida ou cor personalizada
  const knownColors = new Set(presets.map((p) => p.color.toUpperCase()));
  const otherEvents = futureEvents
    .filter((ev) => !knownColors.has((ev.cor || "").toUpperCase()))
    .sort((a, b) => getDaysRemaining(a.data) - getDaysRemaining(b.data));

  if (otherEvents.length > 0) {
    groupedByCategory.push({
      preset: { id: "others", color: "#6B705C", label: "Outros Eventos" },
      events: otherEvents,
    });
  }

  const hasAnyEvents = groupedByCategory.some((group) => group.events.length > 0);

  return (
    <Card className="mt-8 flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-headline-sm text-on-surface font-playfair">
              Próximos Eventos & Prazos
            </h2>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-0.5">
            Contagem regressiva dos compromissos futuros organizados por categoria.
          </p>
        </div>
      </div>

      {!hasAnyEvents ? (
        <div className="py-8 text-center bg-surface-container-low rounded-xl border border-outline-variant">
          <CalendarIcon size={32} className="mx-auto text-on-surface-variant opacity-60 mb-2" />
          <p className="text-body-md text-on-surface font-medium">Nenhum evento futuro agendado</p>
          <p className="text-label-sm text-on-surface-variant mt-1">
            Cadastre eventos ou conecte o Google Agenda para acompanhar os prazos aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedByCategory.map(({ preset, events }) => {
            const catStyle = getPastelStyle(preset.color, poucasCoresAtivo);
            return (
              <div
                key={preset.id}
                className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden"
              >
                {/* Header da Categoria */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between border-b border-outline-variant"
                  style={{ backgroundColor: catStyle.bg }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: catStyle.swatch }}
                    />
                    <span
                      className="text-label-md font-semibold truncate"
                      style={{ color: catStyle.text }}
                    >
                      {preset.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface border border-outline-variant text-on-surface-variant">
                    {events.length} {events.length === 1 ? "evento" : "eventos"}
                  </span>
                </div>

                {/* Lista de Eventos */}
                <div className="p-3 space-y-2 flex-1">
                  {events.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-label-sm text-on-surface-variant italic">
                        Nenhum evento próximo
                      </p>
                    </div>
                  ) : (
                    events.map((ev) => {
                      const days = getDaysRemaining(ev.data);
                      let badgeBg = "bg-primary-container text-on-primary-container";
                      let badgeLabel = `Faltam ${days} dias`;

                      if (days === 0) {
                        badgeBg = poucasCoresAtivo
                          ? ""
                          : "bg-red-100 text-red-900 border border-red-300 font-semibold";
                        badgeLabel = "🚨 Hoje!";
                      } else if (days === 1) {
                        badgeBg = poucasCoresAtivo
                          ? ""
                          : "bg-amber-100 text-amber-900 border border-amber-300 font-semibold";
                        badgeLabel = "⏰ Amanhã";
                      } else if (days <= 7) {
                        badgeBg = poucasCoresAtivo
                          ? ""
                          : "bg-primary/15 text-primary font-semibold border border-primary/30";
                        badgeLabel = `⏳ Faltam ${days} dias`;
                      }

                      return (
                        <div
                          key={ev.id}
                          className="p-2.5 bg-surface rounded-lg border border-outline-variant flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-body-sm font-semibold text-on-surface truncate">
                              {ev.titulo}
                            </p>
                            <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <CalendarIcon size={12} className="flex-shrink-0" />
                              <span>{formatEventDate(ev.data, ev.hora)}</span>
                            </p>
                          </div>
                          <span
                            className={`text-label-xs px-2 py-1 rounded-md flex-shrink-0 whitespace-nowrap ${badgeBg}`}
                            style={
                              poucasCoresAtivo
                                ? {
                                    backgroundColor: PASTEL_GREEN_UNIFIED.bg,
                                    color: PASTEL_GREEN_UNIFIED.text,
                                    border: `1px solid ${PASTEL_GREEN_UNIFIED.border}`,
                                  }
                                : undefined
                            }
                          >
                            {badgeLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
