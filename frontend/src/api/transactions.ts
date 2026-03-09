import apiClient from './client'

export interface Transaction {
  id: string
  amount: number
  description: string
  type: 'income' | 'expense'
  accountId: string
  categoryId: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionRequest {
  amount: number
  description: string
  type: 'income' | 'expense'
  accountId: string
  categoryId: string
  date: string
}

export interface GetTransactionsQuery {
  page?: number
  limit?: number
  accountId?: string
}

export const transactionsAPI = {
  getTransactions: (query?: GetTransactionsQuery) =>
    apiClient.get<{ data: Transaction[]; total: number }>('/api/transactions', { params: query }),

  createTransaction: (data: CreateTransactionRequest) =>
    apiClient.post<Transaction>('/api/transactions', data),

  updateTransaction: (id: string, data: Partial<CreateTransactionRequest>) =>
    apiClient.put<Transaction>(`/api/transactions/${id}`, data),

  deleteTransaction: (id: string) =>
    apiClient.delete(`/api/transactions/${id}`),
}
