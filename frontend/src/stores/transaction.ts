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
      // Asegurar que `amount` sea number, normalizar `type` a minúsculas y exponer `date` para la UI
      transactions.value = (response.data.data ?? []).map((t: any) => {
        const amount = Number(t.amount)
        const type = (t.type || '').toString().toLowerCase()
        // mapear campo de fecha: usar dueDate, paidDate o createdAt
        const date = t.dueDate ?? t.paidDate ?? t.createdAt ?? null
        return {
          ...t,
          amount: Number.isNaN(amount) ? 0 : amount,
          type,
          date,
        }
      })
      total.value = response.data.count ?? 0
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al obtener transacciones'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTransaction = async (data: CreateTransactionRequest) => {
    try {
      // Normalizar payload al formato backend: type en mayúsculas y usar 'dueDate'
      const payload: any = {
        description: data.description,
        amount: data.amount,
        type: (data.type || '').toString().toUpperCase(),
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        dueDate: data.date,
        allowPastDate: true,
      }
      const response = await transactionsAPI.createTransaction(payload)
      // backend responde { success, data: transaction }
      const created = response.data?.data ?? response.data
      const normalized = {
        ...created,
        amount: Number(created.amount),
        type: (created.type || '').toString().toLowerCase(),
        date: created.dueDate ?? created.paidDate ?? created.createdAt ?? null,
      }
      transactions.value.unshift(normalized as any)
      return normalized
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear transacción'
      throw err
    }
  }

  const updateTransaction = async (id: string, data: Partial<CreateTransactionRequest>) => {
    try {
      const response = await transactionsAPI.updateTransaction(id, data)
      const updated = response.data?.data ?? response.data
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = updated
      }
      return updated
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
