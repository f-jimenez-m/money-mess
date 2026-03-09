import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionsAPI, Transaction, CreateTransactionRequest } from '@/api/transactions'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  const getTransactions = async (page = 1, limit = 50, accountId?: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await transactionsAPI.getTransactions({ page, limit, accountId })
      transactions.value = response.data.data
      total.value = response.data.total
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al obtener transacciones'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTransaction = async (data: CreateTransactionRequest) => {
    try {
      const response = await transactionsAPI.createTransaction(data)
      transactions.value.unshift(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear transacción'
      throw err
    }
  }

  const updateTransaction = async (id: string, data: Partial<CreateTransactionRequest>) => {
    try {
      const response = await transactionsAPI.updateTransaction(id, data)
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar transacción'
      throw err
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsAPI.deleteTransaction(id)
      transactions.value = transactions.value.filter(t => t.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar transacción'
      throw err
    }
  }

  const totalIncome = computed(() =>
    transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const totalExpense = computed(() =>
    transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  return {
    transactions,
    isLoading,
    error,
    total,
    totalIncome,
    totalExpense,
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
})
