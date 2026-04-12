"use client";

import { FormEvent, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createTask, deleteTask, updateTask, getTasks, getRecommendations } from "@/lib/api";
import { clearAuthData, getToken, getUserName } from "@/lib/auth";
import { TaskItem } from "@/lib/types";

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
            handleGetRecommendations(title, description);
        }, 400);

        return () => clearTimeout(timeout);
    }, [title, description]);

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

    async function handleGetRecommendations(currentTitle: string, currentDescription: string) {
        const currentToken = getToken();

        if (!currentToken || !currentTitle.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            setRecommendationLoading(true);
            const existingTitles = new Set(tasks.map((t) => t.title.toLowerCase()));
            const response = await getRecommendations({
                title: currentTitle,
                description: currentDescription,
            }, currentToken);

            setSuggestions(
                response.suggestions.filter((s) => !existingTitles.has(s.toLowerCase()))
            );
        } catch (err) {
            setSuggestions([]);
            setError(err instanceof Error ? err.message : "Failed to get suggestions");
        } finally {
            setRecommendationLoading(false);
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
        <main className="min-h-screen p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {userName || "User"}</p>
        </div>
        <button onClick={handleLogout} className="rounded-lg border px-4 py-2">
          Logout
        </button>
      </div>

      <form onSubmit={handleCreateTask} className="rounded-2xl border p-4 space-y-3">
        <input
          className="w-full rounded-lg border p-3"
          placeholder="Task title"
          value={title}
          onChange={(e) => 
            {
                setTitle(e.target.value)
                if(!title.trim()) {
                    setSuggestions([]);
                }
            }}
        />
        <textarea
          className="w-full rounded-lg border p-3"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
        </select>

        <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
        />

        <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
        />
        {recommendationLoading ? (
            <p className="text-sm text-gray-500">Getting suggestions...</p>
            ) : suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleCreateFromSuggestion(suggestion)}
                    className="rounded-full border px-3 py-1 text-sm"
                >
                    {suggestion}
                </button>
                ))}
            </div>
            ) : null}
        <button className="rounded-lg border px-4 py-2">Add task</button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
                key={task.id}
                className="rounded-2xl border p-4 flex items-start justify-between gap-4"
            >
                {editingTaskId === task.id ? (
                <div className="w-full space-y-3">
                    <input
                    className="w-full rounded-lg border p-3"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Task title"
                    />

                    <textarea
                    className="w-full rounded-lg border p-3"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="Description"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                        className="rounded-lg border p-3"
                        value={editingPriority}
                        onChange={(e) => setEditingPriority(e.target.value)}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>

                    <input
                        className="rounded-lg border p-3"
                        type="text"
                        placeholder="Category"
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                    />

                    <input
                        className="rounded-lg border p-3"
                        type="date"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                    />
                    </div>

                    <div className="flex gap-2">
                    <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        Save
                    </button>
                    <button
                        onClick={handleCancelEdit}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        Cancel
                    </button>
                    </div>
                </div>
                ) : (
                <>
                    <div>
                    <h2
                        className={`font-medium ${
                        task.isCompleted ? "line-through text-gray-500" : ""
                        }`}
                    >
                        {task.title}
                    </h2>

                    {task.description ? (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border px-2 py-1">
                        Priority: {task.priority}
                        </span>

                        {task.category ? (
                        <span className="rounded-full border px-2 py-1">
                            Category: {task.category}
                        </span>
                        ) : null}

                        {task.dueDate ? (
                        <span className="rounded-full border px-2 py-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        ) : null}
                    </div>
                    </div>

                    <div className="flex gap-2">
                    <button
                        onClick={() => handleToggleTask(task)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        {task.isCompleted ? "Undo" : "Complete"}
                    </button>

                    <button
                        onClick={() => handleStartEdit(task)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        Edit
                    </button>

                    <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        Delete
                    </button>
                    </div>
                </>
                )}
            </div>
            ))}
        </div>
      )}
    </main>
    );
}