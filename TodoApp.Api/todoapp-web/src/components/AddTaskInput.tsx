"use client";

import { FormEvent } from "react";

type AddTaskInputProps = {
  title: string;
  description: string;
  category: string;
  priority: string;
  dueDate: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export default function AddTaskInput({
  title,
  description,
  category,
  priority,
  dueDate,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onPriorityChange,
  onDueDateChange,
  onSubmit,
}: AddTaskInputProps) {
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

          <input
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none"
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}