import React, { useState, useEffect } from "react";
import { Trash2, Edit2, Check, X, Plus } from "lucide-react";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import type { EventoCalendario } from "../types/database";
import { useLanguage } from "../contexts/LanguageContext";
import { useSensorial } from "../contexts/SensorialContext";
import { getPastelStyle } from "../utils/pastelColors";

interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<EventoCalendario, "id" | "usuario_id" | "criado_em">) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Partial<EventoCalendario>;
  loading?: boolean;
}

interface ColorPreset {
  id: string;
  color: string;
  label: string;
}

const LOCAL_STORAGE_KEY = "broto_calendar_presets";

export const EventoModal: React.FC<EventoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  loading = false,
}) => {
  const { t, language } = useLanguage();
  const { poucasCoresAtivo } = useSensorial();

  // Event form state
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [cor, setCor] = useState("#E76F51");

  // Presets state
  const [presets, setPresets] = useState<ColorPreset[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default presets
    return [
      { id: "1", color: "#E76F51", label: language === "en" ? "Exams" : "Provas" },
      { id: "2", color: "#2A9D8F", label: language === "en" ? "Work" : "Trabalhos" },
      { id: "3", color: "#457B9D", label: language === "en" ? "Studies" : "Estudos" },
      { id: "4", color: "#8338EC", label: language === "en" ? "Leisure" : "Lazer" },
      { id: "5", color: "#F15BB5", label: language === "en" ? "Personal" : "Pessoal" }
    ];
  });

  // Presets editing state
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetColor, setEditingPresetColor] = useState("");
  const [editingPresetLabel, setEditingPresetLabel] = useState("");

  // New preset state
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetColor, setNewPresetColor] = useState("#3A86C8");
  const [newPresetLabel, setNewPresetLabel] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo || "");
      setData(initialData.data || "");
      // Format time from DB (ex: "14:00:00") to time input (ex: "14:00")
      setHora(initialData.hora ? initialData.hora.slice(0, 5) : "");
      setCor(initialData.cor || "#E76F51");
    } else {
      setTitulo("");
      setData("");
      setHora("");
      setCor("#E76F51");
    }
  }, [initialData, isOpen]);

  // Save presets to localStorage
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
    setPresetToDelete(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !data) return;

    setSubmitting(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        data,
        hora: hora || undefined,
        cor,
        tipo: "Work Blocks", // Fallback for postgres checked tipo constraint
        origem: "manual",   // Eventos criados pelo usuário são sempre manuais
      } as any);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = () => {
    if (initialData?.id && onDelete) {
      setIsDeleteEventOpen(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? t("calendar.editEvent") : t("calendar.newEvent")}
    >
      <div className="w-full max-w-md max-h-[70vh] overflow-y-auto pr-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">
              {t("calendar.eventTitle")}
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              disabled={submitting}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-lg text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary"
              placeholder={language === "en" ? "Event title" : "Ex: Reunião de equipe"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">
                {t("calendar.eventDate")}
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-2 bg-surface border border-outline rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Horário */}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">
                {t("calendar.eventTime")}
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2 bg-surface border border-outline rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Seção de Cores e Classificações */}
          <div className="space-y-3 pt-2">
            <label className="block text-label-md text-on-surface-variant">
              {t("calendar.eventColor")}
            </label>

            {/* Presets List */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {presets.map((preset) => {
                const isEditing = editingPresetId === preset.id;
                const isSelected = cor.toLowerCase() === preset.color.toLowerCase();
                return (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between gap-2 p-1.5 bg-surface-container rounded-lg border border-outline-variant"
                  >
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="color"
                          value={editingPresetColor}
                          onChange={(e) => setEditingPresetColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-outline-variant p-0"
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
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPresetId(null)}
                          className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setCor(preset.color)}
                          className={`flex items-center gap-2 flex-1 text-left ${
                            isSelected ? "font-semibold" : ""
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-on-surface border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: getPastelStyle(preset.color, poucasCoresAtivo).swatch }}
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
                            className="p-1 text-[#A5A58D] hover:text-[#6B705C] hover:bg-[#A5A58D] hover:bg-opacity-20 rounded"
                            title={t("calendar.editPreset")}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePreset(preset.id)}
                            className="p-1 text-[#A5A58D] hover:text-error hover:bg-error-container hover:bg-opacity-20 rounded"
                            title={t("calendar.deletePresetConfirm")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Novo preset Form */}
            {isAddingPreset ? (
              <div className="flex items-center gap-2 p-1.5 bg-surface-container rounded-lg border border-outline-variant">
                <input
                  type="color"
                  value={newPresetColor}
                  onChange={(e) => setNewPresetColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-outline-variant p-0"
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
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPreset(false)}
                  className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAddingPreset(true);
                  setNewPresetColor("#3A86C8");
                  setNewPresetLabel("");
                }}
                className="w-full py-1.5 px-3 border border-dashed border-outline hover:bg-surface-container-low rounded-lg text-label-sm text-on-surface-variant transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                {t("calendar.addPreset")}
              </button>
            )}

            {/* Cor customizada livre (Círculo Cromático/Intensidade/Saturação) */}
            <div className="flex items-center justify-between gap-4 p-2 bg-surface-container rounded-lg border border-outline-variant">
              <span className="text-body-sm text-on-surface font-medium">
                {t("calendar.customColor")}
              </span>
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer border border-outline-variant p-0 bg-transparent"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-outline-variant">
            {initialData?.id && onDelete && (
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={submitting || loading}
                className="px-4 py-2 border border-error text-error rounded-lg text-label-md font-medium hover:bg-error-container hover:bg-opacity-10 transition-colors flex items-center gap-1"
              >
                <Trash2 size={16} />
                {language === "en" ? "Delete" : "Deletar"}
              </button>
            )}
            <div className="flex-1 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || loading}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-label-md font-medium transition-colors"
              >
                {t("inbox.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting || loading || !titulo.trim() || !data}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                {submitting ? t("task.saving") : language === "en" ? "Save" : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
