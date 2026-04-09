import {
    AuthResponse,
    CreateTaskRequest,
    LoginRequest,
    SignupRequest,
    TaskItem,
    UpdateTaskRequest,
    RecommendationRequest,
    RecommendationResponse
} from "@/lib/types";

const API_BASE_URL = "http://localhost:5021";

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
        message =
          errorBody?.message ||
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

export async function updateTask(id: string, request: UpdateTaskRequest, token: string): Promise<TaskItem> {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(request),
    });
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