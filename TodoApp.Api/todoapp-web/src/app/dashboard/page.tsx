"use client";

import { FormEvent, useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
    createPlace,
    createTask,
    deletePlace,
    deleteTask,
    getPlaces,
    updateTask,
    getTasks,
    getRecommendations,
    getMyPhoneLink,
    upsertMyPhoneLink,
    getAvailableLines,
    simulateLocationEvent,
} from "@/lib/api";
import { clearAuthData, getToken, getUserName } from "@/lib/auth";
import {
    LinqPhoneNumber,
    LocationReminderResult,
    SavedPlace,
    TaskItem,
    UserPhoneLink,
} from "@/lib/types";
import AddTaskInput from "@/components/AddTaskInput";
import PlacePickerMap from "@/components/PlacePickerMap";
import SuggestionsBar from "@/components/SuggestionsBar";
import TaskList from "@/components/TaskList";

export default function DashboardPage() {
    const router = useRouter();
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

    const [transitioningTasks, setTransitioningTasks] = useState<
        Record<string, "completing" | "uncompleting">
    >({});

    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
    const [sortBy, setSortBy] = useState<"created" | "dueDate" | "priority">("created");
    const [phoneLink, setPhoneLink] = useState<UserPhoneLink | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [assignedFromPhoneNumber, setAssignedFromPhoneNumber] = useState("");
    const [availableLines, setAvailableLines] = useState<LinqPhoneNumber[]>([]);
    const [phoneLinkLoading, setPhoneLinkLoading] = useState(false);
    const [phoneLinkSaving, setPhoneLinkSaving] = useState(false);
    const [editingPhoneLink, setEditingPhoneLink] = useState(false);
    const [places, setPlaces] = useState<SavedPlace[]>([]);
    const [placeName, setPlaceName] = useState("");
    const [placeCategory, setPlaceCategory] = useState("");
    const [placeLatitude, setPlaceLatitude] = useState("");
    const [placeLongitude, setPlaceLongitude] = useState("");
    const [placeRadiusMeters, setPlaceRadiusMeters] = useState("250");
    const [placesLoading, setPlacesLoading] = useState(false);
    const [placeSaving, setPlaceSaving] = useState(false);
    const [capturingLocation, setCapturingLocation] = useState(false);
    const [locationCaptureMessage, setLocationCaptureMessage] = useState("");
    const [simulatingPlaceId, setSimulatingPlaceId] = useState<string | null>(null);
    const [locationResult, setLocationResult] = useState<LocationReminderResult | null>(null);
    const taskCategories = Array.from(
        new Set(
            tasks
                .map((task) => task.category?.trim())
                .filter((category): category is string => Boolean(category))
        )
    ).sort((a, b) => a.localeCompare(b));

    const initializeDashboard = useEffectEvent(() => {
        loadTasks();
        loadPhoneLink();
        loadAvailableLines();
        loadPlaces();
    });

    const requestRecommendations = useEffectEvent(
        (currentTitle: string, currentDescription: string, currentCategory: string) => {
            handleGetRecommendations(currentTitle, currentDescription, currentCategory);
        }
    );

    useEffect(() => {
        const currentToken = getToken();
        const storedName = getUserName() ?? "";

        if (!currentToken) {
            router.replace("/login");
            return;
        }

        setUserName(storedName);
        initializeDashboard();
    }, [router]);

    useEffect(() => {
        if (!title.trim()) {
            setSuggestions([]);
            return;
        }

        const timeout = setTimeout(() => {
            requestRecommendations(title, description, category);
        }, 400);

        return () => clearTimeout(timeout);
    }, [title, description, category]);

    useEffect(() => {
        if (!locationResult) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setLocationResult(null);
        }, 3000);

        return () => window.clearTimeout(timeout);
    }, [locationResult]);

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

    async function loadPhoneLink() {
        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setPhoneLinkLoading(true);
            const data = await getMyPhoneLink(currentToken);
            setPhoneLink(data);
            setPhoneNumber(data.phoneNumber);
            setAssignedFromPhoneNumber(data.assignedFromPhoneNumber);
            setEditingPhoneLink(!data.hasInitiatedConversation);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load linked phone";

            if (message.includes("404") || message.includes("No phone link found")) {
                setPhoneLink(null);
                setEditingPhoneLink(true);
                return;
            }

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        } finally {
            setPhoneLinkLoading(false);
        }
    }

    async function loadAvailableLines() {
        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            const data = await getAvailableLines(currentToken);
            setAvailableLines(data);

            if (!assignedFromPhoneNumber && data.length > 0) {
                setAssignedFromPhoneNumber(data[0].phoneNumber);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load Linq lines";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        }
    }

    async function loadPlaces() {
        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setPlacesLoading(true);
            const data = await getPlaces(currentToken);
            setPlaces(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load places";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        } finally {
            setPlacesLoading(false);
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

    async function handleSavePhoneLink(e: FormEvent) {
        e.preventDefault();

        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setPhoneLinkSaving(true);
            const saved = await upsertMyPhoneLink(
                {
                    phoneNumber,
                    assignedFromPhoneNumber: assignedFromPhoneNumber || undefined,
                },
                currentToken
            );

            setPhoneLink(saved);
            setEditingPhoneLink(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save phone link";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        } finally {
            setPhoneLinkSaving(false);
        }
    }

    async function handleCreatePlace(e: FormEvent) {
        e.preventDefault();

        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setPlaceSaving(true);
            const created = await createPlace(
                {
                    name: placeName,
                    category: placeCategory,
                    latitude: Number(placeLatitude),
                    longitude: Number(placeLongitude),
                    radiusMeters: Number(placeRadiusMeters),
                },
                currentToken
            );

            setPlaces((prev) => [created, ...prev]);
            setPlaceName("");
            setPlaceCategory("");
            setPlaceLatitude("");
            setPlaceLongitude("");
            setPlaceRadiusMeters("250");
            setLocationCaptureMessage("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create place";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        } finally {
            setPlaceSaving(false);
        }
    }

    async function handleUseCurrentLocation() {
        if (!navigator.geolocation) {
            setLocationCaptureMessage("This browser does not support location capture.");
            return;
        }

        setCapturingLocation(true);
        setLocationCaptureMessage("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setPlaceLatitude(position.coords.latitude.toFixed(6));
                setPlaceLongitude(position.coords.longitude.toFixed(6));
                setLocationCaptureMessage("Current location loaded. You can save it as a place now.");
                setCapturingLocation(false);
            },
            (geoError) => {
                setLocationCaptureMessage(
                    geoError.code === geoError.PERMISSION_DENIED
                        ? "Location permission was denied."
                        : "Could not read your current location."
                );
                setCapturingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }

    function handleMapPlaceSelect(selection: {
        name: string;
        latitude: number;
        longitude: number;
    }) {
        if (!placeName.trim() || placeName === "Pinned location") {
            setPlaceName(selection.name);
        }

        setPlaceLatitude(selection.latitude.toFixed(6));
        setPlaceLongitude(selection.longitude.toFixed(6));
        setLocationCaptureMessage("Map selection loaded. You can rename the place before saving.");
    }

    async function handleDeletePlace(id: string) {
        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            await deletePlace(id, currentToken);
            setPlaces((prev) => prev.filter((place) => place.id !== id));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete place";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        }
    }

    async function handleSimulatePlace(place: SavedPlace) {
        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setSimulatingPlaceId(place.id);
            const result = await simulateLocationEvent(
                {
                    latitude: place.latitude,
                    longitude: place.longitude,
                },
                currentToken
            );
            setLocationResult(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to simulate location";

            if (message.includes("401")) {
                clearAuthData();
                router.replace("/login");
                return;
            }

            setError(message);
        } finally {
            setSimulatingPlaceId(null);
        }
    }

    async function handleToggleTask(task: TaskItem) {
  const currentToken = getToken();

  if (!currentToken) {
    clearAuthData();
    router.replace("/login");
    return;
  }

  const nextCompleted = !task.isCompleted;

  try {
    setTransitioningTasks((prev) => ({
      ...prev,
      [task.id]: task.isCompleted ? "uncompleting" : "completing",
    }));

    // Fire backend update immediately, but do not rely on returned object for UI
    const updatePromise = updateTask(
      task.id,
      {
        isCompleted: nextCompleted,
      },
      currentToken
    );

    // Keep the visual state for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Commit the local task state after animation
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, isCompleted: nextCompleted }
          : t
      )
    );

    // Wait for backend update to finish
    await updatePromise;

    // Optional: refresh from backend in background to sync fully
    // await loadTasks();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update task";

    if (message.includes("401")) {
      clearAuthData();
      router.replace("/login");
      return;
    }

    setError(message);
    console.error("Toggle task error:", err);
  } finally {
    setTransitioningTasks((prev) => {
      const copy = { ...prev };
      delete copy[task.id];
      return copy;
    });
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
            console.error("Recommendation error:", err);

            setSuggestions([
                "Review your tasks",
                "Plan tomorrow",
                "Clean workspace",
                "Check emails",
                "Workout",
            ]);
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

                <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Messaging Setup</h2>
                            <p className="mt-1 text-sm text-neutral-400">
                                Link your phone, pick a Linq line, then text first so reminders can continue in the same thread.
                            </p>
                        </div>

                        {phoneLink?.hasInitiatedConversation ? (
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300">
                                Inbound linked
                            </span>
                        ) : (
                            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                                Waiting for first text
                            </span>
                        )}
                    </div>

                    {phoneLinkLoading ? (
                        <div className="mt-4 text-sm text-neutral-400">
                            <p>Loading phone link...</p>
                        </div>
                    ) : phoneLink?.hasInitiatedConversation && !editingPhoneLink ? (
                        <div className="mt-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-white">Messaging is live</p>
                                    <p className="mt-1 text-sm text-neutral-400">
                                        {phoneLink.phoneNumber} is connected through {phoneLink.assignedFromPhoneNumber}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setEditingPhoneLink(true)}
                                    className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 transition hover:bg-neutral-800"
                                >
                                    Edit setup
                                </button>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Status</p>
                                    <p className="mt-2 text-sm text-neutral-200">Inbound thread established</p>
                                </div>

                                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Next trigger</p>
                                    <p className="mt-2 text-sm text-neutral-200">Location reminders can send automatically</p>
                                </div>

                                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Message commands</p>
                                    <p className="mt-2 text-sm text-neutral-200">LIST, ADD, DONE, DELETE, SNOOZE</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSavePhoneLink} className="mt-4 grid gap-3 md:grid-cols-3">
                                <input
                                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                                    placeholder="+1 555 555 5555"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />

                                <select
                                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none"
                                    value={assignedFromPhoneNumber}
                                    onChange={(e) => setAssignedFromPhoneNumber(e.target.value)}
                                >
                                    <option value="">Select Linq line</option>
                                    {availableLines.map((line) => (
                                        <option key={line.phoneNumber} value={line.phoneNumber}>
                                            {line.phoneNumber} ({line.status})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="submit"
                                    disabled={phoneLinkSaving}
                                    className="rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {phoneLinkSaving ? "Saving..." : "Save phone link"}
                                </button>
                            </form>

                            <div className="mt-3 text-sm text-neutral-400">
                                {phoneLink ? (
                                    <p>
                                        Linked: {phoneLink.phoneNumber} via {phoneLink.assignedFromPhoneNumber}
                                    </p>
                                ) : (
                                    <p>No linked phone yet.</p>
                                )}
                            </div>
                        </>
                    )}
                </section>

                <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Saved Places</h2>
                        <p className="mt-1 text-sm text-neutral-400">
                            Save places that matter for errands or routines, then use them to trigger contextual reminders.
                        </p>
                    </div>

                    <form onSubmit={handleCreatePlace} className="mt-4 grid gap-3 md:grid-cols-5">
                        <input
                            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                            placeholder="Trader Joe's"
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                        />
                        <select
                            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none"
                            value={placeCategory}
                            onChange={(e) => setPlaceCategory(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select task category
                            </option>
                            {taskCategories.map((taskCategory) => (
                                <option key={taskCategory} value={taskCategory}>
                                    {taskCategory}
                                </option>
                            ))}
                        </select>
                        <input
                            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                            placeholder="Latitude"
                            value={placeLatitude}
                            onChange={(e) => setPlaceLatitude(e.target.value)}
                        />
                        <input
                            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                            placeholder="Longitude"
                            value={placeLongitude}
                            onChange={(e) => setPlaceLongitude(e.target.value)}
                        />
                        <input
                            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                            placeholder="Radius meters"
                            value={placeRadiusMeters}
                            onChange={(e) => setPlaceRadiusMeters(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={capturingLocation}
                            className="rounded-2xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                        >
                            {capturingLocation ? "Finding location..." : "Use current location"}
                        </button>

                        <button
                            type="submit"
                            disabled={placeSaving || !placeCategory}
                            className="rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3 md:justify-self-end"
                        >
                            {placeSaving ? "Saving place..." : "Add place"}
                        </button>
                    </form>

                    {locationCaptureMessage ? (
                        <p className="mt-3 text-sm text-neutral-400">{locationCaptureMessage}</p>
                    ) : (
                        <p className="mt-3 text-sm text-neutral-500">
                            Tip: use your current location for fast setup, then rename the place to something memorable.
                        </p>
                    )}

                    <div className="mt-4">
                        <PlacePickerMap
                            latitude={placeLatitude ? Number(placeLatitude) : undefined}
                            longitude={placeLongitude ? Number(placeLongitude) : undefined}
                            onSelect={handleMapPlaceSelect}
                        />
                    </div>

                    {locationResult ? (
                        <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
                            <p>{locationResult.message}</p>
                        </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                        {placesLoading ? (
                            <p className="text-sm text-neutral-400">Loading places...</p>
                        ) : places.length === 0 ? (
                            <p className="text-sm text-neutral-400">No places yet.</p>
                        ) : (
                            places.map((place) => (
                                <div
                                    key={place.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-white">{place.name}</p>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            {place.category || "no category"} · {place.radiusMeters}m radius
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSimulatePlace(place)}
                                            disabled={simulatingPlaceId === place.id}
                                            className="rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {simulatingPlaceId === place.id ? "Simulating..." : "Simulate arrival"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePlace(place.id)}
                                            className="rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-red-400 transition hover:bg-neutral-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

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
                    tasks={tasks}
                    filter={filter}
                    sortBy={sortBy}
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
                    transitioningTasks={transitioningTasks}
                />
            </div>
        </main>
    );
}
