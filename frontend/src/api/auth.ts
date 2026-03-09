import apiClient from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  passwordConfirm: string
}

export interface AuthResponse {
  accessToken: string
  user: {
    id: string
    email: string
    createdAt: string
    updatedAt: string
  }
}

export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export const authAPI = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/auth/login', data),

  getProfile: () =>
    apiClient.get<User>('/api/auth/me'),
}
