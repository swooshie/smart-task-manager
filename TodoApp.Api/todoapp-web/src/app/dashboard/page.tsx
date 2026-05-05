"use client";

import { FormEvent, useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    createPlace,
    createTask,
    deletePlace,
    deleteTask,
    getPlaces,
    updatePlace,
    updateTask,
    getTasks,
    getRecommendations,
    getMyPhoneLink,
    upsertMyPhoneLink,
    reportLocationEvent,
} from "@/lib/api";
import { clearAuthData, getToken, getUserName } from "@/lib/auth";
import {
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
    const TELEGRAM_BOT_USERNAME = "smart_task_manager_swooshie_bot";
    const LOCATION_POLL_INTERVAL_MS = 30000;
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [category, setCategory] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [taskLocationReminderEnabled, setTaskLocationReminderEnabled] = useState(false);
    const [taskPlaceId, setTaskPlaceId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingDescription, setEditingDescription] = useState("");
    const [editingPriority, setEditingPriority] = useState("medium");
    const [editingCategory, setEditingCategory] = useState("");
    const [editingDueDate, setEditingDueDate] = useState("");
    const [editingLocationReminderEnabled, setEditingLocationReminderEnabled] = useState(false);
    const [editingPlaceId, setEditingPlaceId] = useState("");

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationWarmingUp, setRecommendationWarmingUp] = useState(false);

    const [transitioningTasks, setTransitioningTasks] = useState<
        Record<string, "completing" | "uncompleting">
    >({});

    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
    const [sortBy, setSortBy] = useState<"created" | "dueDate" | "priority">("created");
    const [phoneLink, setPhoneLink] = useState<UserPhoneLink | null>(null);
    const [preferredChannel, setPreferredChannel] = useState<"linq" | "telegram">("telegram");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [assignedFromPhoneNumber, setAssignedFromPhoneNumber] = useState("");
    const [telegramUsername, setTelegramUsername] = useState("");
    const [phoneLinkLoading, setPhoneLinkLoading] = useState(false);
    const [phoneLinkSaving, setPhoneLinkSaving] = useState(false);
    const [editingPhoneLink, setEditingPhoneLink] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [placesOpen, setPlacesOpen] = useState(false);
    const [placeSelectionTarget, setPlaceSelectionTarget] = useState<"task-create" | "task-edit" | null>(null);
    const [places, setPlaces] = useState<SavedPlace[]>([]);
    const [placeName, setPlaceName] = useState("");
    const [placeCategory, setPlaceCategory] = useState("");
    const [placeLatitude, setPlaceLatitude] = useState("");
    const [placeLongitude, setPlaceLongitude] = useState("");
    const [placeRadiusMeters, setPlaceRadiusMeters] = useState("250");
    const [editingPlaceEntryId, setEditingPlaceEntryId] = useState<string | null>(null);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [placeSaving, setPlaceSaving] = useState(false);
    const [capturingLocation, setCapturingLocation] = useState(false);
    const [locationCaptureMessage, setLocationCaptureMessage] = useState("");
    const [reportingCurrentLocation, setReportingCurrentLocation] = useState(false);
    const [locationResult, setLocationResult] = useState<LocationReminderResult | null>(null);
    const locationPollIntervalRef = useRef<number | null>(null);
    const initializeDashboard = useEffectEvent(() => {
        loadTasks();
        loadPhoneLink();
        loadPlaces();
    });

    const requestRecommendations = useEffectEvent(
        (currentTitle: string, currentDescription: string, currentCategory: string) => {
            handleGetRecommendations(currentTitle, currentDescription, currentCategory);
        }
    );

    const refreshTasksOnReturn = useEffectEvent(() => {
        loadTasks();
    });

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
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refreshTasksOnReturn();
            }
        };

        const handleWindowFocus = () => {
            refreshTasksOnReturn();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    useEffect(() => {
        if (!locationResult) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setLocationResult(null);
        }, 6000);

        return () => window.clearTimeout(timeout);
    }, [locationResult]);

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        const runLocationCheck = () => {
            if (document.visibilityState !== "visible") {
                return;
            }

            void reportCurrentLocation({ silentNoop: true, showLoadingState: false });
        };

        const startPolling = () => {
            if (locationPollIntervalRef.current !== null) {
                window.clearInterval(locationPollIntervalRef.current);
            }

            runLocationCheck();
            locationPollIntervalRef.current = window.setInterval(runLocationCheck, LOCATION_POLL_INTERVAL_MS);
        };

        const stopPolling = () => {
            if (locationPollIntervalRef.current !== null) {
                window.clearInterval(locationPollIntervalRef.current);
                locationPollIntervalRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                startPolling();
            } else {
                stopPolling();
            }
        };

        startPolling();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    function requireToken() {
        const currentToken = getToken();

        if (!currentToken) {
            clearAuthData();
            router.replace("/login");
            return null;
        }

        return currentToken;
    }

    function mapLocationResultToToast(result: LocationReminderResult): LocationReminderResult | null {
        if (result.reminderSent) {
            return {
                ...result,
                message: result.placeName
                    ? `Reminder sent near ${result.placeName}.`
                    : "Reminder sent.",
            };
        }

        if (
            result.message === "No saved place matched this location." ||
            result.message === "You are near a saved place, but no open task is linked to it." ||
            result.message === "A reminder for this place and task was sent recently."
        ) {
            return null;
        }

        if (result.message === "Link your messaging channel and send it a first message before reminders can be sent.") {
            return {
                ...result,
                message: "Finish linking your messaging channel to enable reminders.",
            };
        }

        return result;
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
            setPreferredChannel(data.preferredChannel);
            setPhoneNumber(data.phoneNumber ?? "");
            setAssignedFromPhoneNumber(data.assignedFromPhoneNumber ?? "");
            setTelegramUsername(data.telegramUsername ?? "");
            setEditingPhoneLink(!data.hasInitiatedConversation);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load linked phone";

            if (message.includes("404") || message.includes("No phone link found")) {
            setPhoneLink(null);
            setPreferredChannel("telegram");
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
                placeId: taskLocationReminderEnabled ? taskPlaceId || null : null,
                locationReminderEnabled: taskLocationReminderEnabled,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            }, currentToken);

            setTasks((prev) => [created, ...prev]);
            setTitle("");
            setDescription("");
            setPriority("medium");
            setCategory("");
            setDueDate("");
            setTaskLocationReminderEnabled(false);
            setTaskPlaceId("");
            setSuggestions([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task");
        }
    }

    function handleCreateFromSuggestion(suggestion: string) {
        setTitle(suggestion);
    }

    async function handleSavePhoneLink(e: FormEvent) {
        e.preventDefault();

        const currentToken = requireToken();
        if (!currentToken) return;

        try {
            setPhoneLinkSaving(true);
            const saved = await upsertMyPhoneLink(
                {
                    preferredChannel,
                    phoneNumber: preferredChannel === "linq" ? phoneNumber : undefined,
                    assignedFromPhoneNumber:
                        preferredChannel === "linq" ? assignedFromPhoneNumber || undefined : undefined,
                    telegramUsername:
                        preferredChannel === "telegram" ? telegramUsername : undefined,
                },
                currentToken
            );

            setPhoneLink(saved);
            setEditingPhoneLink(false);
            setSettingsOpen(false);
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

    function handlePreferredChannelChange(channel: "linq" | "telegram") {
        setPreferredChannel(channel);

        if (channel === "telegram") {
            setEditingPhoneLink(true);
            return;
        }

        setEditingPhoneLink(true);
    }

    async function handleCreatePlace(e: FormEvent) {
        e.preventDefault();

        const currentToken = requireToken();
        if (!currentToken) return;

        if (!placeName.trim()) {
            setError("Place name is required.");
            return;
        }

        const latitude = Number(placeLatitude);
        const longitude = Number(placeLongitude);
        const radiusMeters = Number(placeRadiusMeters);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            setError("Pick a location from the map or use your current location before saving the place.");
            return;
        }

        if (!Number.isFinite(radiusMeters) || radiusMeters < 25 || radiusMeters > 5000) {
            setError("Radius must be between 25 and 5000 meters.");
            return;
        }

        try {
            setPlaceSaving(true);
            const request = {
                name: placeName,
                category: placeCategory.trim() || undefined,
                latitude,
                longitude,
                radiusMeters,
            };

            if (editingPlaceEntryId) {
                const updated = await updatePlace(editingPlaceEntryId, request, currentToken);
                setPlaces((prev) => prev.map((place) => (place.id === updated.id ? updated : place)));
                if (taskPlaceId === updated.id) {
                    setTaskPlaceId(updated.id);
                }
                if (editingPlaceId === updated.id) {
                    setEditingPlaceId(updated.id);
                }
            } else {
                const created = await createPlace(request, currentToken);
                setPlaces((prev) => [created, ...prev]);
                if (placeSelectionTarget === "task-create") {
                    setTaskLocationReminderEnabled(true);
                    setTaskPlaceId(created.id);
                    setPlacesOpen(false);
                    setPlaceSelectionTarget(null);
                } else if (placeSelectionTarget === "task-edit") {
                    setEditingLocationReminderEnabled(true);
                    setEditingPlaceId(created.id);
                    setPlacesOpen(false);
                    setPlaceSelectionTarget(null);
                }
            }
            setPlaceName("");
            setPlaceCategory("");
            setPlaceLatitude("");
            setPlaceLongitude("");
            setPlaceRadiusMeters("250");
            setEditingPlaceEntryId(null);
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

        const linkedTasks = tasks.filter((task) => task.placeId === id);
        const openLinkedCount = linkedTasks.filter((task) => !task.isCompleted).length;
        const completedLinkedCount = linkedTasks.filter((task) => task.isCompleted).length;

        if (linkedTasks.length > 0) {
            const confirmed = window.confirm(
                `This place is linked to ${linkedTasks.length} task(s) ` +
                `(${openLinkedCount} open, ${completedLinkedCount} completed). ` +
                `If you continue, the place will be removed from all linked tasks.`
            );

            if (!confirmed) {
                return;
            }
        }

        try {
            await deletePlace(id, currentToken);
            setPlaces((prev) => prev.filter((place) => place.id !== id));
            setTasks((prev) =>
                prev.map((task) =>
                    task.placeId === id
                        ? { ...task, placeId: null, locationReminderEnabled: false }
                        : task
                )
            );
            if (editingPlaceEntryId === id) {
                setEditingPlaceEntryId(null);
                setPlaceName("");
                setPlaceCategory("");
                setPlaceLatitude("");
                setPlaceLongitude("");
                setPlaceRadiusMeters("250");
            }
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

    const reportCurrentLocation = useEffectEvent(
        async (options?: { silentNoop?: boolean; showLoadingState?: boolean }) => {
        const currentToken = requireToken();
        if (!currentToken) return;

        if (!navigator.geolocation) {
            setLocationResult({
                reminderSent: false,
                message: "This browser does not support location reporting.",
            });
            return;
        }

        try {
            if (options?.showLoadingState !== false) {
                setReportingCurrentLocation(true);
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const result = await reportLocationEvent(
                            {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            },
                            currentToken
                        );
                        const toastResult = mapLocationResultToToast(result);
                        if (toastResult || !options?.silentNoop) {
                            setLocationResult(toastResult);
                        }
                    } catch (err) {
                        const message = err instanceof Error ? err.message : "Failed to report current location";

                        if (message.includes("401")) {
                            clearAuthData();
                            router.replace("/login");
                            return;
                        }

                        setError(message);
                    } finally {
                        if (options?.showLoadingState !== false) {
                            setReportingCurrentLocation(false);
                        }
                    }
                },
                (geoError) => {
                    if (!options?.silentNoop) {
                        setLocationResult({
                            reminderSent: false,
                            message:
                                geoError.code === geoError.PERMISSION_DENIED
                                    ? "Location permission was denied."
                                    : "Could not read your current location.",
                        });
                    }

                    if (options?.showLoadingState !== false) {
                        setReportingCurrentLocation(false);
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } catch {
            if (options?.showLoadingState !== false) {
                setReportingCurrentLocation(false);
            }
        }
    });

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
            placeId: editingLocationReminderEnabled ? editingPlaceId || null : null,
            locationReminderEnabled: editingLocationReminderEnabled,
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
        setEditingLocationReminderEnabled(Boolean(task.locationReminderEnabled));
        setEditingPlaceId(task.placeId || "");
        setEditingDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    }

    function handleCancelEdit() {
        setEditingTaskId(null);
        setEditingTitle("");
        setEditingDescription("");
        setEditingPriority("medium");
        setEditingCategory("");
        setEditingLocationReminderEnabled(false);
        setEditingPlaceId("");
        setEditingDueDate("");
    }

    function handleOpenPlacesForCreate() {
        setEditingPlaceEntryId(null);
        setPlaceName("");
        setPlaceCategory("");
        setPlaceLatitude("");
        setPlaceLongitude("");
        setPlaceRadiusMeters("250");
        setLocationCaptureMessage("");
        setPlaceSelectionTarget("task-create");
        setPlacesOpen(true);
    }

    function handleOpenPlacesForEdit() {
        setEditingPlaceEntryId(null);
        setPlaceName("");
        setPlaceCategory("");
        setPlaceLatitude("");
        setPlaceLongitude("");
        setPlaceRadiusMeters("250");
        setLocationCaptureMessage("");
        setPlaceSelectionTarget("task-edit");
        setPlacesOpen(true);
    }

    function handleManagePlace(placeId: string) {
        const place = places.find((item) => item.id === placeId);
        if (!place) {
            return;
        }

        setEditingPlaceEntryId(place.id);
        setPlaceName(place.name);
        setPlaceCategory(place.category ?? "");
        setPlaceLatitude(place.latitude.toFixed(6));
        setPlaceLongitude(place.longitude.toFixed(6));
        setPlaceRadiusMeters(String(place.radiusMeters));
        setPlacesOpen(true);
    }

    function handleLogout() {
        clearAuthData();
        router.replace("/login");
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
            {locationResult ? (
                <div className="fixed right-4 top-4 z-50 w-[min(28rem,calc(100vw-2rem))]">
                    <div
                        className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${
                            locationResult.reminderSent
                                ? "border-emerald-500/40 bg-emerald-950/95 text-emerald-100"
                                : "border-neutral-700 bg-neutral-950/95 text-neutral-100"
                        }`}
                    >
                        <p className="text-sm font-medium">
                            {locationResult.reminderSent ? "Reminder sent" : "Location update"}
                        </p>
                        <p className="mt-1 text-sm opacity-90">{locationResult.message}</p>
                    </div>
                </div>
            ) : null}

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

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPlacesOpen(true)}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-2.5 text-neutral-200 shadow-sm transition hover:bg-neutral-800"
                        aria-label="Open places"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
                            <circle cx="12" cy="11" r="2.5" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-2.5 text-neutral-200 shadow-sm transition hover:bg-neutral-800"
                        aria-label="Open settings"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.674 1.724 1.724 0 0 0 .91 2.264 1.724 1.724 0 0 1 0 3.358 1.724 1.724 0 0 0-.91 2.264 1.724 1.724 0 0 1-2.898 1.674 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.898-1.674 1.724 1.724 0 0 0-.91-2.264 1.724 1.724 0 0 1 0-3.358 1.724 1.724 0 0 0 .91-2.264 1.724 1.724 0 0 1 2.898-1.674 1.724 1.724 0 0 0 2.573-1.066Z"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 shadow-sm transition hover:bg-neutral-800"
                    >
                        Logout
                    </button>
                </div>
                </div>

                <AddTaskInput
                    title={title}
                    description={description}
                    category={category}
                    priority={priority}
                    dueDate={dueDate}
                    locationReminderEnabled={taskLocationReminderEnabled}
                    selectedPlaceId={taskPlaceId}
                    places={places}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onCategoryChange={setCategory}
                    onPriorityChange={setPriority}
                    onDueDateChange={setDueDate}
                    onLocationReminderEnabledChange={setTaskLocationReminderEnabled}
                    onSelectedPlaceIdChange={setTaskPlaceId}
                    onOpenPlaces={() => {
                        if (taskPlaceId) {
                            handleManagePlace(taskPlaceId);
                        } else {
                            handleOpenPlacesForCreate();
                        }
                    }}
                    onClearPlace={() => {
                        setTaskPlaceId("");
                        setTaskLocationReminderEnabled(false);
                    }}
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
                    editingLocationReminderEnabled={editingLocationReminderEnabled}
                    editingPlaceId={editingPlaceId}
                    places={places}
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
                    setEditingLocationReminderEnabled={setEditingLocationReminderEnabled}
                    setEditingPlaceId={setEditingPlaceId}
                    onOpenPlaces={() => {
                        if (editingPlaceId) {
                            handleManagePlace(editingPlaceId);
                        } else {
                            handleOpenPlacesForEdit();
                        }
                    }}
                    onClearPlace={() => {
                        setEditingPlaceId("");
                        setEditingLocationReminderEnabled(false);
                    }}
                    transitioningTasks={transitioningTasks}
                />
            </div>

            {settingsOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
                    <button
                        type="button"
                        aria-label="Close settings"
                        onClick={() => setSettingsOpen(false)}
                        className="flex-1 cursor-default"
                    />
                    <aside className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Settings</p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">Messaging</h2>
                                <p className="mt-2 text-sm text-neutral-400">
                                    Keep reminders and quick actions in one conversation.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                                className="rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Messaging</h3>
                                    <p className="mt-1 text-sm text-neutral-400">
                                        One thread. Fewer excuses.
                                    </p>
                                </div>

                                {phoneLink?.hasInitiatedConversation ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300">
                                        <span className="h-2 w-2 rounded-full bg-green-400" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                                        <span className="h-2 w-2 rounded-full bg-red-400" />
                                        Not connected
                                    </span>
                                )}
                            </div>

                            {phoneLinkLoading ? (
                                <div className="mt-4 text-sm text-neutral-400">
                                    <p>Loading messaging status...</p>
                                </div>
                            ) : phoneLink && !editingPhoneLink ? (
                                <div className="mt-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {phoneLink.hasInitiatedConversation ? "Messaging is live" : "Messaging is saved"}
                                            </p>
                                            <p className="mt-1 text-sm text-neutral-400">
                                                {phoneLink.preferredChannel === "telegram"
                                                    ? `@${phoneLink.telegramUsername} is connected on Telegram`
                                                    : `${phoneLink.phoneNumber} is connected by text`}
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

                                    <div className="mt-4 grid gap-3">
                                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                                            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Status</p>
                                            <p className="mt-2 text-sm text-neutral-200">
                                                {phoneLink.hasInitiatedConversation
                                                    ? "Inbound thread established"
                                                    : preferredChannel === "telegram"
                                                        ? `Send HELP to @${TELEGRAM_BOT_USERNAME} to finish linking`
                                                        : "Send a first text to finish linking"}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                                            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Channel</p>
                                            <p className="mt-2 text-sm text-neutral-200">
                                                {phoneLink.preferredChannel === "telegram" ? "Telegram" : "Text"}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                                            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Commands</p>
                                            <p className="mt-2 text-sm text-neutral-200">LIST, ADD, DONE, DELETE, SNOOZE</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <form onSubmit={handleSavePhoneLink} className="mt-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-2 rounded-3xl border border-neutral-800 bg-neutral-950 p-2">
                                            <button
                                                type="button"
                                                onClick={() => handlePreferredChannelChange("telegram")}
                                                className={`rounded-2xl px-4 py-3 text-left transition ${
                                                    preferredChannel === "telegram"
                                                        ? "bg-white text-black"
                                                        : "bg-transparent text-white hover:bg-neutral-900"
                                                }`}
                                            >
                                                <p className="text-sm font-medium">Telegram</p>
                                                <p className={`mt-1 text-xs ${preferredChannel === "telegram" ? "text-neutral-700" : "text-neutral-400"}`}>
                                                    Free and always on
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handlePreferredChannelChange("linq")}
                                                className={`rounded-2xl px-4 py-3 text-left transition ${
                                                    preferredChannel === "linq"
                                                        ? "bg-white text-black"
                                                        : "bg-transparent text-white hover:bg-neutral-900"
                                                }`}
                                            >
                                                <p className="text-sm font-medium">Text</p>
                                                <p className={`mt-1 text-xs ${preferredChannel === "linq" ? "text-neutral-700" : "text-neutral-400"}`}>
                                                    Linq-powered fallback
                                                </p>
                                            </button>
                                        </div>

                                        {preferredChannel === "telegram" ? (
                                            <div className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Telegram identity</p>
                                                    <p className="mt-1 text-xs text-neutral-400">
                                                        Save your handle, then send `HELP` to start the thread.
                                                    </p>
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                                    <input
                                                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                                                        placeholder="@your_telegram_username"
                                                        value={telegramUsername}
                                                        onChange={(e) => setTelegramUsername(e.target.value)}
                                                    />
                                                    <a
                                                        href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 transition hover:bg-neutral-800"
                                                    >
                                                        Open bot
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Text identity</p>
                                                    <p className="mt-1 text-xs text-neutral-400">
                                                        Use your phone number for text-based reminders.
                                                    </p>
                                                </div>
                                                <div className="grid gap-3">
                                                    <input
                                                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                                                        placeholder="+1 555 555 5555"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={phoneLinkSaving}
                                            className="w-full rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {phoneLinkSaving ? "Saving..." : "Save messaging setup"}
                                        </button>
                                    </form>

                                    <div className="mt-3 text-sm text-neutral-400">
                                        <p>
                                            {preferredChannel === "telegram"
                                                ? `Save your username, then send HELP to @${TELEGRAM_BOT_USERNAME}.`
                                                : "Save your number, then send a first text to connect it."}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            ) : null}

            {placesOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
                    <button
                        type="button"
                        aria-label="Close places"
                        onClick={() => {
                            setPlacesOpen(false);
                            setPlaceSelectionTarget(null);
                        }}
                        className="flex-1 cursor-default"
                    />
                    <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Places</p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">Places</h2>
                                <p className="mt-2 text-sm text-neutral-400">
                                    Save the places your future self tends to forget.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setPlacesOpen(false);
                                    setPlaceSelectionTarget(null);
                                }}
                                className="rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Places</h3>
                                    <p className="mt-1 text-sm text-neutral-400">
                                        Give your tasks a sense of place.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-right">
                                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Location</p>
                                    <p className="mt-1 text-sm text-neutral-200">
                                        {reportingCurrentLocation
                                            ? "Checking current location..."
                                            : "Checks every 30 seconds"}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleCreatePlace} className="mt-4 grid gap-3 md:grid-cols-5">
                                <input
                                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                                    placeholder="Trader Joe's"
                                    value={placeName}
                                    onChange={(e) => setPlaceName(e.target.value)}
                                />
                                <input
                                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-500"
                                    placeholder="Category (optional)"
                                    value={placeCategory}
                                    onChange={(e) => setPlaceCategory(e.target.value)}
                                />
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
                                    disabled={placeSaving}
                                    className="rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3 md:justify-self-end"
                                >
                                    {placeSaving
                                        ? editingPlaceEntryId
                                            ? "Saving changes..."
                                            : "Saving place..."
                                        : editingPlaceEntryId
                                            ? "Save place changes"
                                            : "Add place"}
                                </button>
                            </form>

                            {editingPlaceEntryId ? (
                                <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
                                    <p>Editing place</p>
                                </div>
                            ) : null}

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
                                                    onClick={() => handleManagePlace(place.id)}
                                                    className="rounded-2xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition hover:bg-neutral-700"
                                                >
                                                    Edit
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
                        </div>
                    </aside>
                </div>
            ) : null}
        </main>
    );
}
