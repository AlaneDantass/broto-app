import type { Task } from "../types/database";
import { PASTEL_GREEN_UNIFIED } from "./pastelColors";

export const getNextOrderForPriority = (
  tasks: Task[],
  prioridade: string | null | undefined
): number => {
  // Filter tasks with the same priority
  const samePriorityTasks = tasks.filter((t) => t.prioridade === prioridade);

  // If no tasks with this priority exist, start with 1
  if (samePriorityTasks.length === 0) {
    return 1;
  }

  // Get the maximum order and add 1
  const maxOrder = Math.max(...samePriorityTasks.map((t) => t.ordem || 0));
  return maxOrder + 1;
};

export const getPriorityColor = (
  prioridade: string | null | undefined,
  poucasCores: boolean = false
): { bg: string; border: string; text: string } => {
  if (poucasCores && prioridade) {
    return {
      bg: PASTEL_GREEN_UNIFIED.bg,
      border: PASTEL_GREEN_UNIFIED.swatch,
      text: PASTEL_GREEN_UNIFIED.text,
    };
  }

  switch (prioridade) {
    case "urgente":
      return {
        bg: "#FCEAE4",
        border: "#EFA892",
        text: "#692B1B",
      };
    case "bloqueadora":
      return {
        bg: "#FDF1E2",
        border: "#EDBE8A",
        text: "#664014",
      };
    case "importante":
      return {
        bg: "#DCEFE0",
        border: "#9CCBA6",
        text: "#234829",
      };
    default:
      return {
        bg: "transparent",
        border: "transparent",
        text: "inherit",
      };
  }
};

export const getPriorityLabel = (
  prioridade: string | null | undefined,
  language: string
): string => {
  switch (prioridade) {
    case "urgente":
      return language === "en" ? "Urgent" : "Urgente";
    case "bloqueadora":
      return language === "en" ? "Blocking" : "Bloqueadora";
    case "importante":
      return language === "en" ? "Important" : "Importante";
    default:
      return language === "en" ? "No priority" : "Sem prioridade";
  }
};
