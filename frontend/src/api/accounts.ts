import apiClient from './client'

export interface Account {
  id: string
  name: string
  type: 'cash' | 'checking' | 'savings' | 'credit_card' | 'investment'
  initialBalance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  name: string
  type: string
  initialBalance: number
  currency: string
}

export const accountsAPI = {
  getAccounts: () =>
    apiClient.get<Account[]>('/api/accounts'),

  createAccount: (data: CreateAccountRequest) =>
    apiClient.post<Account>('/api/accounts', data),

  updateAccount: (id: string, data: Partial<CreateAccountRequest>) =>
    apiClient.put<Account>(`/api/accounts/${id}`, data),

  deleteAccount: (id: string) =>
    apiClient.delete(`/api/accounts/${id}`),
}
