export type AuthResponse = {
  token: string;
  name: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
};

export type TaskItem = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string | null;
  priority: string;
	category?: string | null;
	dueDate?: string | null;
};

export type CreateTaskRequest = {
  title: string;
  description?: string;
	priority?: string;
	category?: string;
	dueDate?: string | null;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string;
  isCompleted?: boolean;
	priority?: string;
	category?: string;
	dueDate?: string | null;
};

export type RecommendationRequest = {
	title: string;
	description?: string;
  category?: string;
}

export type RecommendationResponse = {
	suggestions: string[];
}
