import {
    AuthResponse,
    CreateSavedPlaceRequest,
    CreateTaskRequest,
    LinqPhoneNumber,
    LoginRequest,
    LocationReminderResult,
    ReportLocationEventRequest,
    SavedPlace,
    SignupRequest,
    TaskItem,
    UpsertUserPhoneLinkRequest,
    UpdateTaskRequest,
    UpdateSavedPlaceRequest,
    UserPhoneLink,
    RecommendationRequest,
    RecommendationResponse
} from "@/lib/types";

const API_BASE_URL = 
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5021";

function getAuthHeaders(token?: string) : HeadersInit {
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const raw = await response.text();

    // console.error("API error status:", response.status);
    // console.error("API error body:", raw);

    let message = `HTTP ${response.status}`;

    if (raw) {
      try {
        const errorBody = JSON.parse(raw);
        const validationErrors = errorBody?.errors
          ? Object.values(errorBody.errors)
              .flat()
              .filter(Boolean)
              .join(" ")
          : "";

        message =
          errorBody?.message ||
          validationErrors ||
          errorBody?.title ||
          JSON.stringify(errorBody);
      } catch {
        message = raw;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
    });
    return handleResponse<AuthResponse>(response);
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
    });
    return handleResponse<AuthResponse>(response);
}

export async function getTasks(token: string): Promise<TaskItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse<TaskItem[]>(response);
}

export async function createTask(request: CreateTaskRequest, token: string): Promise<TaskItem> {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
    return handleResponse<TaskItem>(response);
}

export async function updateTask(
  id: string,
  request: UpdateTaskRequest,
  token: string
): Promise<TaskItem> {
  console.log("updateTask called", {
    id,
    request,
    hasToken: !!token,
    apiBaseUrl: API_BASE_URL,
  });

  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(request),
  });

  console.log("updateTask response status", response.status);

  return handleResponse<TaskItem>(response);
}

export async function deleteTask(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
    });
    return handleResponse<void>(response);
}

export async function getRecommendations(request: RecommendationRequest, token: string): Promise<RecommendationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
    return handleResponse<RecommendationResponse>(response);
}

export async function getMyPhoneLink(token: string): Promise<UserPhoneLink> {
    const response = await fetch(`${API_BASE_URL}/api/phone-links/me`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse<UserPhoneLink>(response);
}

export async function upsertMyPhoneLink(
    request: UpsertUserPhoneLinkRequest,
    token: string
): Promise<UserPhoneLink> {
    const response = await fetch(`${API_BASE_URL}/api/phone-links/me`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
    return handleResponse<UserPhoneLink>(response);
}

export async function getAvailableLines(token: string): Promise<LinqPhoneNumber[]> {
    const response = await fetch(`${API_BASE_URL}/api/phone-links/available-lines`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse<LinqPhoneNumber[]>(response);
}

export async function getPlaces(token: string): Promise<SavedPlace[]> {
    const response = await fetch(`${API_BASE_URL}/api/places`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse<SavedPlace[]>(response);
}

export async function createPlace(
    request: CreateSavedPlaceRequest,
    token: string
): Promise<SavedPlace> {
    const response = await fetch(`${API_BASE_URL}/api/places`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
    return handleResponse<SavedPlace>(response);
}

export async function deletePlace(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
    });
    return handleResponse<void>(response);
}

export async function updatePlace(
    id: string,
    request: UpdateSavedPlaceRequest,
    token: string
): Promise<SavedPlace> {
    const response = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
    return handleResponse<SavedPlace>(response);
}

export async function reportLocationEvent(
    request: ReportLocationEventRequest,
    token: string
): Promise<LocationReminderResult> {
    const response = await fetch(`${API_BASE_URL}/api/location-events/report`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
    return handleResponse<LocationReminderResult>(response);
}
