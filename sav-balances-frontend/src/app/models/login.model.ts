export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  fullName: string;
  message: string;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  role: string;
  fullName: string;
  enabled?: boolean;
  lastLogin?: string;
  createdAt?: string;
}