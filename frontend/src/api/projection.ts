import apiClient from './client'

export const projectionAPI = {
  getMonthly: (months = 3) => apiClient.get(`/api/projection/monthly?months=${months}`),
  getAll: (days = 30) => apiClient.get(`/api/projection?days=${days}`),
  getAccountTimeline: (accountId: string, days = 30) => apiClient.get(`/api/projection/timeline/${accountId}?days=${days}`),
}
