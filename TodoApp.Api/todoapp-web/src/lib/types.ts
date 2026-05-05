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
	placeId?: string | null;
	locationReminderEnabled?: boolean;
	dueDate?: string | null;
};

export type CreateTaskRequest = {
  title: string;
  description?: string;
	priority?: string;
	category?: string;
	placeId?: string | null;
	locationReminderEnabled?: boolean;
	dueDate?: string | null;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string;
	isCompleted?: boolean;
	priority?: string;
	category?: string;
	placeId?: string | null;
	locationReminderEnabled?: boolean;
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

export type UserPhoneLink = {
  phoneNumber?: string | null;
  assignedFromPhoneNumber?: string | null;
  telegramUsername?: string | null;
  linqChatId?: string | null;
  telegramChatId?: string | null;
  preferredChannel: "linq" | "telegram";
  hasInitiatedConversation: boolean;
  firstInboundMessageAt?: string | null;
  lastInboundMessageAt?: string | null;
  lastOutboundMessageAt?: string | null;
};

export type UpsertUserPhoneLinkRequest = {
  phoneNumber?: string;
  assignedFromPhoneNumber?: string;
  telegramUsername?: string;
  preferredChannel: "linq" | "telegram";
};

export type LinqPhoneNumber = {
  phoneNumber: string;
  status: string;
};

export type SavedPlace = {
  id: string;
  name: string;
  category?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type CreateSavedPlaceRequest = {
  name: string;
  category?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type UpdateSavedPlaceRequest = CreateSavedPlaceRequest;

export type ReportLocationEventRequest = {
  latitude: number;
  longitude: number;
};

export type LocationReminderResult = {
  reminderSent: boolean;
  placeName?: string | null;
  taskTitle?: string | null;
  message?: string | null;
};
