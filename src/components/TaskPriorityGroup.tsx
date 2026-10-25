import React from "react";
import { getPriorityColor, getPriorityLabel } from "../utils/taskOrder";
import { useLanguage } from "../contexts/LanguageContext";
import { useSensorial } from "../contexts/SensorialContext";
import { TaskCard } from "./TaskCard";
import type { Task } from "../types/database";

interface TaskPriorityGroupProps {
  tasks: Task[];
  prioridade: "urgente" | "bloqueadora" | "importante" | null;
  onToggle: (id: string, status: Task["status"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onFocus?: (task: Task) => void;
  onStartPomodoro?: (taskId: string) => void;
  onPomodoroUpdate?: (taskId: string, pomodoros: number | null) => void;
}

export const TaskPriorityGroup: React.FC<TaskPriorityGroupProps> = ({
  tasks,
  prioridade,
  onToggle,
  onEdit,
  onDelete,
  onFocus,
  onStartPomodoro,
  onPomodoroUpdate,
}) => {
  const { language } = useLanguage();
  const { poucasCoresAtivo } = useSensorial();

  if (tasks.length === 0) {
    return null;
  }

  const colors = getPriorityColor(prioridade, poucasCoresAtivo);
  const label = getPriorityLabel(prioridade, language);

  return (
    <div>
      <div
        className="px-3 py-2 rounded-lg mb-3 flex items-center gap-2"
        style={{
          backgroundColor: colors.bg,
          borderLeft: `4px solid ${colors.border}`,
        }}
      >
        <span
          className="text-label-md font-medium"
          style={{ color: colors.text }}
        >
          {label} ({tasks.length})
        </span>
      </div>
      <div className="space-y-3 ml-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={() => onToggle(task.id, task.status)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
            onFocus={() => onFocus?.(task)}
            onStartPomodoro={() => onStartPomodoro?.(task.id)}
            onPomodoroUpdate={(pomodoros) => onPomodoroUpdate?.(task.id, pomodoros)}
          />
        ))}
      </div>
    </div>
  );
};
