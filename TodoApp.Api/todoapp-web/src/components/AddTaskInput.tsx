"use client";

import { FormEvent } from "react";

type AddTaskInputProps = {
  title: string;
  description: string;
  category: string;
  priority: string;
  dueDate: string;
  locationReminderEnabled: boolean;
  selectedPlaceId: string;
  places: Array<{ id: string; name: string; category?: string | null }>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onLocationReminderEnabledChange: (value: boolean) => void;
  onSelectedPlaceIdChange: (value: string) => void;
  onOpenPlaces: () => void;
  onClearPlace: () => void;
  onSubmit: (e: FormEvent) => void;
};

export default function AddTaskInput({
  title,
  description,
  category,
  priority,
  dueDate,
  locationReminderEnabled,
  selectedPlaceId,
  places,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onPriorityChange,
  onDueDateChange,
  onLocationReminderEnabledChange,
  onSelectedPlaceIdChange,
  onOpenPlaces,
  onClearPlace,
  onSubmit,
}: AddTaskInputProps) {
  const selectedPlace = places.find((place) => place.id === selectedPlaceId);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
        <span className="text-xl text-neutral-500">+</span>
        <input
          className="w-full bg-transparent text-base text-white outline-none placeholder:text-neutral-500"
          placeholder="Add a task"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div className="mt-3 grid gap-3">
        <textarea
          className="min-h-[90px] rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
          placeholder="Notes"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
            placeholder="Category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          />

          <select
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>

          <div className="relative">
            <input
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 pr-11 text-sm text-white outline-none"
              type="date"
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
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
                Let the right place nudge the right task.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onLocationReminderEnabledChange(!locationReminderEnabled)}
              aria-pressed={locationReminderEnabled}
              aria-label="Toggle location reminder"
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
                locationReminderEnabled
                  ? "border-emerald-400/40 bg-emerald-400"
                  : "border-neutral-700 bg-neutral-800"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  locationReminderEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {locationReminderEnabled ? (
            <div className="mt-3 space-y-3">
              <select
                className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none"
                value={selectedPlaceId}
                onChange={(e) => onSelectedPlaceIdChange(e.target.value)}
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
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={locationReminderEnabled && !selectedPlaceId}
          className="rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}
