"use client";

import TaskItem from "@/components/TaskItem";
import { TaskItem as Task } from "@/lib/types";

type TaskListProps = {
    tasks: Task[];
    loading: boolean;
    editingTaskId: string | null;
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
};

export default function TaskList(props: TaskListProps) {
    const activeTasks = props.tasks.filter((task) => !task.isCompleted);
    const completedTasks = props.tasks.filter((task) => task.isCompleted);

    if(props.loading) {
        return (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
            <p className="text-sm text-neutral-400">Loading tasks...</p>
        </div>
        );
    }

    if (props.tasks.length === 0) {
        return (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
            <p className="text-base font-medium text-white">No tasks yet</p>
            <p className="mt-1 text-sm text-neutral-400">Start by adding one above.</p>
        </div>
        );
    }

    return (
        <div className="space-y-6">
            <section>
                <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Tasks</h2>
                <span className="text-sm text-neutral-500">{activeTasks.length}</span>
                </div>

                <div className="space-y-3">
                {activeTasks.map((task) => (
                    <TaskItem
                    key={task.id}
                    task={task}
                    isEditing={props.editingTaskId === task.id}
                    editingTitle={props.editingTitle}
                    editingDescription={props.editingDescription}
                    editingCategory={props.editingCategory}
                    editingPriority={props.editingPriority}
                    editingDueDate={props.editingDueDate}
                    onToggle={props.onToggle}
                    onDelete={props.onDelete}
                    onStartEdit={props.onStartEdit}
                    onCancelEdit={props.onCancelEdit}
                    onSaveEdit={props.onSaveEdit}
                    setEditingTitle={props.setEditingTitle}
                    setEditingDescription={props.setEditingDescription}
                    setEditingCategory={props.setEditingCategory}
                    setEditingPriority={props.setEditingPriority}
                    setEditingDueDate={props.setEditingDueDate}
                    />
                ))}
                </div>
            </section>

            {completedTasks.length > 0 ? (
                <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900">Completed</h2>
                    <span className="text-sm text-neutral-500">{completedTasks.length}</span>
                </div>

                <div className="space-y-3">
                    {completedTasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        isEditing={props.editingTaskId === task.id}
                        editingTitle={props.editingTitle}
                        editingDescription={props.editingDescription}
                        editingCategory={props.editingCategory}
                        editingPriority={props.editingPriority}
                        editingDueDate={props.editingDueDate}
                        onToggle={props.onToggle}
                        onDelete={props.onDelete}
                        onStartEdit={props.onStartEdit}
                        onCancelEdit={props.onCancelEdit}
                        onSaveEdit={props.onSaveEdit}
                        setEditingTitle={props.setEditingTitle}
                        setEditingDescription={props.setEditingDescription}
                        setEditingCategory={props.setEditingCategory}
                        setEditingPriority={props.setEditingPriority}
                        setEditingDueDate={props.setEditingDueDate}
                    />
                    ))}
                </div>
                </section>
            ) : null}
        </div>
    );
}