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

export interface User {
  id: string
  email: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthPayload {
  accessToken: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export const authAPI = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthPayload>>('/api/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthPayload>>('/api/auth/login', data),

  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/api/auth/me'),
}
