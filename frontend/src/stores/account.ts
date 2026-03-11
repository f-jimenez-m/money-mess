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
      // backend responde { success, data: Account[] }
      const accs = response.data?.data ?? []

      // Intentar obtener balances por cuenta y mapear a `initialBalance`
      try {
        const balRes = await accountsAPI.getBalances()
        const balances = balRes.data?.data?.accounts ?? []
        const balanceMap: Record<string, number> = {}
        balances.forEach((b: any) => {
          balanceMap[b.accountId] = Number(b.currentBalance ?? 0)
        })

        accounts.value = accs.map((a: any) => ({
          ...a,
          initialBalance: balanceMap[a.id] ?? 0,
        }))
      } catch (e) {
        accounts.value = accs
      }
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
      // backend responde { success, data: account }
      const created = response.data?.data
      if (created) accounts.value.push(created)
      return created
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear cuenta'
      throw err
    }
  }

  const updateAccount = async (id: string, data: Partial<CreateAccountRequest>) => {
    try {
      const response = await accountsAPI.updateAccount(id, data)
      const updated = response.data?.data
      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1 && updated) {
        accounts.value[index] = updated
      }
      return updated
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
