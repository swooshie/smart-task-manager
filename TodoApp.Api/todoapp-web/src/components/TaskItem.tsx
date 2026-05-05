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
  editingLocationReminderEnabled: boolean;
  editingPlaceId: string;
  places: Array<{ id: string; name: string; category?: string | null }>;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartEdit: (task: Task) => void;
  onSaveEdit: (id: string) => void;
  setEditingTitle: (value: string) => void;
  setEditingDescription: (value: string) => void;
  setEditingCategory: (value: string) => void;
  setEditingPriority: (value: string) => void;
  setEditingDueDate: (value: string) => void;
  setEditingLocationReminderEnabled: (value: boolean) => void;
  setEditingPlaceId: (value: string) => void;
  onOpenPlaces: () => void;
  onClearPlace: () => void;
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
  editingLocationReminderEnabled,
  editingPlaceId,
  places,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  setEditingTitle,
  setEditingDescription,
  setEditingCategory,
  setEditingPriority,
  setEditingDueDate,
  setEditingLocationReminderEnabled,
  setEditingPlaceId,
  onOpenPlaces,
  onClearPlace,
  transitionState
}: TaskItemProps) {
    const visuallyCompleted = task.isCompleted || transitionState === "completing";
    const selectedPlace = places.find((place) => place.id === editingPlaceId);
    // const visuallyCompleted = task.isCompleted;
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

            <div className="relative">
              <input
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 pr-11 text-white outline-none"
                  type="date"
                  value={editingDueDate}
                  onChange={(e) => setEditingDueDate(e.target.value)}
                  onClick={(e) => {
                      const input = e.currentTarget;
                      if (input.showPicker) {
                          input.showPicker();
                      }
                  }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
                  if (input?.showPicker) {
                    input.showPicker();
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-200"
                aria-label="Open calendar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M16 2v3M3.5 9.5h17M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V7A1.5 1.5 0 0 1 5 5.5Z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Location</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Give this task a place with a good memory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingLocationReminderEnabled(!editingLocationReminderEnabled)}
                aria-pressed={editingLocationReminderEnabled}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
                  editingLocationReminderEnabled
                    ? "border-emerald-400/40 bg-emerald-400"
                    : "border-neutral-700 bg-neutral-800"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    editingLocationReminderEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {editingLocationReminderEnabled ? (
              <div className="mt-3 space-y-3">
                <select
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none"
                  value={editingPlaceId}
                  onChange={(e) => setEditingPlaceId(e.target.value)}
                >
                  <option value="">Select a saved place</option>
                  {places.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}{place.category ? ` (${place.category})` : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={onOpenPlaces}
                  className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 transition hover:bg-neutral-800"
                >
                  Places
                </button>

                {selectedPlace ? (
                  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                    <p className="text-sm font-medium text-white">{selectedPlace.name}</p>
                    <p className="mt-1 text-xs text-neutral-300">
                      {selectedPlace.category ? selectedPlace.category : "Linked place"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={onOpenPlaces}
                        className="rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 transition hover:bg-neutral-800"
                      >
                        Edit place
                      </button>
                      <button
                        type="button"
                        onClick={onClearPlace}
                        className="rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-red-300 transition hover:bg-neutral-800"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSaveEdit(task.id)}
              disabled={editingLocationReminderEnabled && !editingPlaceId}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
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

            {task.locationReminderEnabled ? (
              <span
                className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300"
                aria-label="Location reminder enabled"
                title="Location reminder enabled"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-3.5 w-3.5 rotate-45">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 7 18-7-4-7 4 7-18Z" />
                </svg>
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
