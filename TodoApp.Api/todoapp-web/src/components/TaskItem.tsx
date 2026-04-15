"use client";

import { TaskItem as Task } from "@/lib/types";
import { motion } from "framer-motion"

type TaskItemProps = {
  task: Task;
  isEditing: boolean;
  editingTitle: string;
  editingDescription: string;
  editingCategory: string;
  editingPriority: string;
  editingDueDate: string;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartEdit: (task: Task) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  setEditingTitle: (value: string) => void;
  setEditingDescription: (value: string) => void;
  setEditingCategory: (value: string) => void;
  setEditingPriority: (value: string) => void;
  setEditingDueDate: (value: string) => void;
  transitionState?: "completing" | "uncompleting";
};

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    case "medium":
      return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20";
    case "low":
      return "bg-green-500/15 text-green-300 border border-green-500/20";
    default:
      return "bg-neutral-800 text-neutral-300 border border-neutral-700";
  }
}

export default function TaskItem({
  task,
  isEditing,
  editingTitle,
  editingDescription,
  editingCategory,
  editingPriority,
  editingDueDate,
  onToggle,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  setEditingTitle,
  setEditingDescription,
  setEditingCategory,
  setEditingPriority,
  setEditingDueDate,
  transitionState
}: TaskItemProps) {
    const visuallyCompleted = task.isCompleted || transitionState === "completing";
  if (isEditing) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <div className="space-y-3">
          <input
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none placeholder:text-neutral-500"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            placeholder="Task title"
          />

          <textarea
            className="min-h-[90px] w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none placeholder:text-neutral-500"
            value={editingDescription}
            onChange={(e) => setEditingDescription(e.target.value)}
            placeholder="Notes"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none placeholder:text-neutral-500"
              value={editingCategory}
              onChange={(e) => setEditingCategory(e.target.value)}
              placeholder="Category"
            />

            <select
              className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none"
              value={editingPriority}
              onChange={(e) => setEditingPriority(e.target.value)}
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>

            <input
              className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-white outline-none"
              type="date"
              value={editingDueDate}
              onChange={(e) => setEditingDueDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSaveEdit(task.id)}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
            >
              Save
            </button>

            <button
              onClick={onCancelEdit}
              className="rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-100 transition hover:bg-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
    className={`rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm transition duration-300 ${
        visuallyCompleted ? "opacity-70" : ""
    } ${transitionState ? "scale-[0.985]" : ""}`}
    >
      <div className="flex items-start gap-3">
        <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => onToggle(task)}
            className={`relative z-10 mt-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border transition ${
                visuallyCompleted
                ? "border-white bg-white"
                : "border-neutral-500 bg-transparent hover:border-neutral-300"
            }`}
            aria-label={task.isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
            {visuallyCompleted && (
                <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block h-3 w-3 rounded-full bg-black"
                />
            )}
        </motion.button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
                className={`text-base font-medium ${
                    visuallyCompleted ? "line-through text-neutral-500" : "text-white"
                }`}
                >
                {task.title}
            </h3>

            {task.priority ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClasses(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            ) : null}

            {task.category ? (
              <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                {task.category}
              </span>
            ) : null}
          </div>

          {task.description ? (
            <p className="mt-2 text-sm text-neutral-400">{task.description}</p>
          ) : null}

          {task.dueDate ? (
            <p className="mt-2 text-xs text-neutral-500">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onStartEdit(task)}
            className="rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition hover:bg-neutral-700"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-red-400 transition hover:bg-neutral-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}