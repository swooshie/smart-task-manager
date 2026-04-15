"use client";

import TaskItem from "@/components/TaskItem";
import { TaskItem as Task } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";

type TaskListProps = {
    tasks: Task[];
    filter: "all" | "active" | "completed";
    sortBy: "created" | "dueDate" | "priority"
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
    transitioningTasks: Record<string, "completing" | "uncompleting">;
};

export default function TaskList(props: TaskListProps) {
    const priorityOrder: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1,
    };

    const sortedTasks = [...props.tasks].sort((a, b) => {
        if (props.sortBy === "dueDate") {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        if (props.sortBy === "priority") {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    let activeTasks = sortedTasks.filter((task) => !task.isCompleted);
    let completedTasks = sortedTasks.filter((task) => task.isCompleted);

    if (props.filter === "active") {
        completedTasks = [];
    }

    if (props.filter === "completed") {
        activeTasks = [];
    }

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
                    <AnimatePresence mode="popLayout">
                        {activeTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial = {{opacity: 0, y: 12 }}
                                animate = {{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
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
                                    transitionState={props.transitioningTasks[task.id]}
                                    />
                            </motion.div> 
                        ))}
                    </AnimatePresence>
                </div>
            </section>
            <AnimatePresence mode="popLayout">
                {completedTasks.length > 0 ? (
                    <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Completed</h2>
                        <span className="text-sm text-neutral-500">{completedTasks.length}</span>
                    </div>

                    <div className="space-y-3">
                        {completedTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                >
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
                                    transitionState={props.transitioningTasks[task.id]}
                            />
                        </motion.div>
                        ))}
                    </div>
                    </section>
                ) : null}
            </AnimatePresence>
            
        </div>
    );
}