export interface User {
  id: string;
  emailId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  emailId: string;
  username: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  emailId: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  emailId?: string;
  currentPassword?: string;
  password?: string;
}

export interface UsersListResponse {
  success: boolean;
  count: number;
  data: User[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: User;
}
