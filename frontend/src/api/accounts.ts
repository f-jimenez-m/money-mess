import apiClient from './client'

export type AccountType = 'CASH' | 'BANK' | 'CREDIT' | 'SAVINGS'

export interface Account {
  id: string
  name: string
  type: AccountType
  initialBalance?: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  initialBalance?: number
  currency: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  count?: number
}

export const accountsAPI = {
  getAccounts: () =>
    apiClient.get<ApiResponse<Account[]>>('/api/accounts'),

  createAccount: (data: CreateAccountRequest) =>
    apiClient.post<ApiResponse<Account>>('/api/accounts', data),

  updateAccount: (id: string, data: Partial<CreateAccountRequest>) =>
    apiClient.put<ApiResponse<Account>>(`/api/accounts/${id}`, data),

  deleteAccount: (id: string) =>
    apiClient.delete(`/api/accounts/${id}`),
  getBalances: () =>
    apiClient.get<ApiResponse<{ accounts: Array<{ accountId: string; accountName: string; currency: string; currentBalance: string }>; total: string; count: number }>>('/api/accounts/balances'),
}
