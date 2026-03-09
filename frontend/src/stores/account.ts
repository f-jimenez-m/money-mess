import { defineStore } from 'pinia'
import { ref } from 'vue'
import { accountsAPI, Account, CreateAccountRequest } from '@/api/accounts'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const getAccounts = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await accountsAPI.getAccounts()
      accounts.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al obtener cuentas'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createAccount = async (data: CreateAccountRequest) => {
    try {
      const response = await accountsAPI.createAccount(data)
      accounts.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear cuenta'
      throw err
    }
  }

  const updateAccount = async (id: string, data: Partial<CreateAccountRequest>) => {
    try {
      const response = await accountsAPI.updateAccount(id, data)
      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        accounts.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar cuenta'
      throw err
    }
  }

  const deleteAccount = async (id: string) => {
    try {
      await accountsAPI.deleteAccount(id)
      accounts.value = accounts.value.filter(a => a.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar cuenta'
      throw err
    }
  }

  return {
    accounts,
    isLoading,
    error,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  }
})
