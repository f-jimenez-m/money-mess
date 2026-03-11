import apiClient from './client'

export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  color?: string
  icon?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export const categoriesAPI = {
  getCategories: () => apiClient.get<ApiResponse<Category[]>>('/api/categories'),
  createCategory: (payload: Partial<Category>) => apiClient.post<ApiResponse<Category>>('/api/categories', payload),
}
