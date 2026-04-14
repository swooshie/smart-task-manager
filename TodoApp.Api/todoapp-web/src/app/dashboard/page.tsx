"use client";

import { FormEvent, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createTask, deleteTask, updateTask, getTasks, getRecommendations } from "@/lib/api";
import { clearAuthData, getToken, getUserName } from "@/lib/auth";
import { TaskItem } from "@/lib/types";
import AddTaskInput from "@/components/AddTaskInput";
import SuggestionsBar from "@/components/SuggestionsBar";
import TaskList from "@/components/TaskList";

export default function DashboardPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [category, setCategory] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingDescription, setEditingDescription] = useState("");
    const [editingPriority, setEditingPriority] = useState("medium");
    const [editingCategory, setEditingCategory] = useState("");
    const [editingDueDate, setEditingDueDate] = useState("");

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationWarmingUp, setRecommendationWarmingUp] = useState(false);

    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
    const [sortBy, setSortBy] = useState<"created" | "dueDate" | "priority">("created");

    const priorityOrder: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1,
    };

    const filteredTasks = tasks.
        filter((task) => {
            if(filter == "active") return !task.isCompleted;
            if(filter == "completed") return task.isCompleted;
            return true;
        })
        .sort((a, b) => {
            if(sortBy === "dueDate"){
                if(!a.dueDate && !b.dueDate) return 0;
                if(!a.dueDate) return 1;
                if(!b.dueDate) return -1;
                
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if(sortBy === "priority"){
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    useEffect(() => {
        const currentToken = getToken();
        const storedName = getUserName() ?? "";

        if (!currentToken) {
            router.replace("/login");
            return;
        }

        setUserName(storedName);
        loadTasks();
    }, [router]);

    useEffect(() => {
        if (!title.trim()) {
            setSuggestions([]);
            return;
        }

        const timeout = setTimeout(() => {
            handleGetRecommendations(title, description, category);
        }, 400);

        return () => clearTimeout(timeout);
    }, [title, description, category]);

    function requireToken() {
        const currentToken = getToken();

        if (!currentToken) {
            clearAuthData();
            router.replace("/login");
            return null;
        }

        return currentToken;
    }

    async function loadTasks() {
        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setLoading(true);
            const data = await getTasks(currentToken);
            setTasks(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load tasks";

            if (message.includes("401")) {
            clearAuthData();
            router.replace("/login");
            return;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateTask(e: FormEvent) {
        e.preventDefault();

        const currentToken = getToken();
        if (!currentToken) {
            router.replace("/login");
            return;
        }

        try {
            const created = await createTask({
                title,
                description,
                priority,
                category,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            }, currentToken);

            setTasks((prev) => [created, ...prev]);
            setTitle("");
            setDescription("");
            setPriority("medium");
            setCategory("");
            setDueDate("");
            setSuggestions([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task");
        }
    }

    async function handleCreateFromSuggestion(suggestion: string) {
        const currentToken = getToken();
        if (!currentToken) return;

        try {
            const created = await createTask({
            title: suggestion,
            description: "",
            priority: "medium",
            category: "suggested",
            }, currentToken);

            setTasks((prev) => [created, ...prev]);
            setSuggestions([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task");
        }
    }

    async function handleToggleTask(task: TaskItem) {
        const currentToken = getToken();

        if (!currentToken) {
            clearAuthData();
            router.replace("/login");
            return;
        }

        try {
            const updated = await updateTask(task.id, {
            isCompleted: !task.isCompleted,
            }, currentToken);

            setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update task";

            if (message.includes("401")) {
            clearAuthData();
            router.replace("/login");
            return;
            }

            setError(message);
            console.error("Toggle task error:", err);
        }
    }

    async function handleDeleteTask(id: string) {
        const currentToken = getToken();
        console.log(currentToken);

        if (!currentToken) {
            clearAuthData();
            router.replace("/login");
            return;
        }

        try {
            await deleteTask(id, currentToken);
            setTasks((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete task";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
            console.error("Delete task error:", err);
        }
    }

    async function handleSaveEdit(taskId: string) {
        const currentToken = getToken();

        if (!currentToken) {
            clearAuthData();
            router.replace("/login");
            return;
        }

        try {
            const updated = await updateTask(taskId, {
            title: editingTitle,
            description: editingDescription,
            priority: editingPriority,
            category: editingCategory,
            dueDate: editingDueDate
                ? new Date(editingDueDate).toISOString()
                : undefined,
            }, currentToken);

            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            handleCancelEdit();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update task";

            if (message.includes("401")) {
            clearAuthData();
            router.replace("/login");
            return;
            }

            setError(message);
        }
    }

    async function handleGetRecommendations(currentTitle: string, currentDescription: string, currentCategory: string) {
        const currentToken = getToken();

        if (!currentToken || !currentTitle.trim()) {
            setSuggestions([]);
            return;
        }

        let warmingTimer: ReturnType<typeof setTimeout> | null = null;

        try {
            setRecommendationLoading(true);
            setRecommendationWarmingUp(true);
            const existingTitles = new Set(tasks.map((t) => t.title.toLowerCase()));
            
            warmingTimer = setTimeout(()=>{
                setRecommendationWarmingUp(true)
            }, 2500);
            
            const response = await getRecommendations({
                title: currentTitle,
                description: currentDescription,
                category: currentCategory
            }, currentToken);

            setSuggestions(
                response.suggestions.filter((s) => !existingTitles.has(s.toLowerCase()))
            );
        } catch (err) {
            setSuggestions([]);
            setError(err instanceof Error ? err.message : "Failed to get suggestions");
        } finally {
            if(warmingTimer){
                clearTimeout(warmingTimer);
            }
            setRecommendationLoading(false);
            setRecommendationWarmingUp(false);
        }
        }

    function handleStartEdit(task: TaskItem) {
        setEditingTaskId(task.id);
        setEditingTitle(task.title);
        setEditingDescription(task.description || "");
        setEditingPriority(task.priority);
        setEditingCategory(task.category || "");
        setEditingDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    }

    function handleCancelEdit() {
        setEditingTaskId(null);
        setEditingTitle("");
        setEditingDescription("");
        setEditingPriority("medium");
        setEditingCategory("");
        setEditingDueDate("");
    }

    function handleLogout() {
        clearAuthData();
        router.replace("/login");
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-light text-neutral-200">
                    Reminders
                    </h1>
                    <p className="mt-1 text-sm text-neutral-400">
                    Welcome, {userName || "User"}
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 shadow-sm transition hover:bg-neutral-800"
                >
                    Logout
                </button>
                </div>

                <AddTaskInput
                    title={title}
                    description={description}
                    category={category}
                    priority={priority}
                    dueDate={dueDate}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onCategoryChange={setCategory}
                    onPriorityChange={setPriority}
                    onDueDateChange={setDueDate}
                    onSubmit={handleCreateTask}
                />

                <SuggestionsBar
                suggestions={suggestions}
                loading={recommendationLoading}
                warmingUp={recommendationWarmingUp}
                onSuggestionClick={handleCreateFromSuggestion}
                />

                {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-3 shadow-sm">
                    <div className="flex gap-2">
                        {["all", "active", "completed"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as "all" | "active" | "completed")}
                            className={`rounded-full px-3 py-1.5 text-sm transition ${
                            filter === f
                                ? "bg-white text-black"
                                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                        ))}
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "created" | "dueDate" | "priority")}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-white outline-none"
                    >
                        <option value="created">Newest</option>
                        <option value="dueDate">Due date</option>
                        <option value="priority">Priority</option>
                    </select>
                </div>

                <TaskList
                    tasks={filteredTasks}
                    loading={loading}
                    editingTaskId={editingTaskId}
                    editingTitle={editingTitle}
                    editingDescription={editingDescription}
                    editingCategory={editingCategory}
                    editingPriority={editingPriority}
                    editingDueDate={editingDueDate}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    setEditingTitle={setEditingTitle}
                    setEditingDescription={setEditingDescription}
                    setEditingCategory={setEditingCategory}
                    setEditingPriority={setEditingPriority}
                    setEditingDueDate={setEditingDueDate}
                />
            </div>
        </main>
    );
}