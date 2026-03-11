import apiClient from './client'

export interface RecurringRule {
  id: string
  userId?: string
  name: string
  type?: string
  amount?: number
  frequency?: string
  startDate?: string
  endDate?: string | null
  dayOfMonth?: number | null
  accountId?: string | null
  categoryId?: string | null
  installmentsTotal?: number | null
  createdAt?: string
  updatedAt?: string
}

export const recurringAPI = {
  getAll: () => apiClient.get('/api/recurring-rules'),
  getById: (id: string) => apiClient.get(`/api/recurring-rules/${id}`),
  create: (payload: Partial<RecurringRule>) => apiClient.post('/api/recurring-rules', payload),
  update: (id: string, payload: Partial<RecurringRule>) => apiClient.put(`/api/recurring-rules/${id}`, payload),
  execute: (payload?: { ruleId?: string; upToDate?: string }) => apiClient.post('/api/recurring-rules/execute', payload),
  delete: (id: string) => apiClient.delete(`/api/recurring-rules/${id}`),
}
