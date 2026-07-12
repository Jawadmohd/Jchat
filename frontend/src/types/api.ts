export interface User {
  id: string;
  emailId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface RegisterRequest {
  emailId: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  emailId: string;
  password: string;
}
