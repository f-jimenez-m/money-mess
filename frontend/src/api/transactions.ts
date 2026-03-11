import apiClient from './client'

export interface Transaction {
  id: string
  amount: number
  description: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  categoryId?: string | null
  date: string
  dueDate?: string
  paidDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionRequest {
  amount: number
  description: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  categoryId?: string | null
  date: string
}

export interface GetTransactionsQuery {
  page?: number
  limit?: number
  accountId?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  count?: number
}

export const transactionsAPI = {
  getTransactions: (query?: GetTransactionsQuery) =>
    apiClient.get<ApiResponse<Transaction[]>>('/api/transactions', { params: query }),

  createTransaction: (data: CreateTransactionRequest) =>
    apiClient.post<ApiResponse<Transaction>>('/api/transactions', data),

  updateTransaction: (id: string, data: Partial<CreateTransactionRequest>) =>
    apiClient.put<ApiResponse<Transaction>>(`/api/transactions/${id}`, data),

  deleteTransaction: (id: string) =>
    apiClient.delete(`/api/transactions/${id}`),
}
