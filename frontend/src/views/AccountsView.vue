<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-indigo-600">MoneyMess</h1>
        <div class="flex gap-6 items-center">
          <router-link to="/dashboard" class="text-gray-600 hover:text-indigo-600">
            Dashboard
          </router-link>
          <router-link to="/transactions" class="text-gray-600 hover:text-indigo-600">
            Transacciones
          </router-link>
          <router-link to="/accounts" class="text-gray-600 hover:text-indigo-600">
            Cuentas
          </router-link>
          <button
            @click="handleLogout"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-8">Cuentas</h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow p-6">
            <div v-if="accountStore.isLoading" class="text-center py-12">
              <p class="text-gray-600">Cargando cuentas...</p>
            </div>
            <div v-else-if="accountStore.accounts.length === 0" class="text-center py-12">
              <p class="text-gray-600">No hay cuentas</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="account in accountStore.accounts"
                :key="account.id"
                class="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ account.name }}</p>
                  <p class="text-sm text-gray-600">{{ account.type }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-indigo-600">{{ account.currency }} {{ (account.initialBalance ?? 0).toFixed(2) }}</p>
                  <button
                    @click="deleteAccount(account.id)"
                    class="text-sm text-red-600 hover:text-red-700 mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Nueva Cuenta</h3>
            <form @submit.prevent="createAccount" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  v-model="newAccount.name"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  v-model="newAccount.type"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="CASH">Efectivo</option>
                  <option value="BANK">Corriente</option>
                  <option value="SAVINGS">Ahorros</option>
                  <option value="CREDIT">Tarjeta de crédito</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                <input
                  v-model.number="newAccount.initialBalance"
                  type="number"
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select
                  v-model="newAccount.currency"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CLP">CLP</option>
                  <option value="ARS">ARS</option>
                  <option value="MXN">MXN</option>
                </select>
              </div>

              <button
                type="submit"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Crear
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountStore } from '@/stores/account'
import { useTransactionStore } from '@/stores/transaction'
import type { CreateAccountRequest } from '@/api/accounts'

const router = useRouter()
  const authStore = useAuthStore()
  const accountStore = useAccountStore()
  const transactionStore = useTransactionStore()

const newAccount = reactive<CreateAccountRequest>({
  name: '',
  // usar los enums que espera el backend: CASH | BANK | CREDIT | SAVINGS
  type: 'BANK',
  initialBalance: 0,
  currency: 'USD',
})

onMounted(async () => {
  try {
    await accountStore.getAccounts()
    // refrescar transacciones para incluir la transacción inicial creada en backend
    try { await transactionStore.getTransactions() } catch (e) { /* noop */ }
  } catch (error) {
    console.error('Error loading accounts:', error)
  }
})

const createAccount = async () => {
  try {
    await accountStore.createAccount({
      name: newAccount.name,
      type: newAccount.type,
      initialBalance: newAccount.initialBalance,
      currency: newAccount.currency,
    })
    // refrescar lista para obtener estado actualizado (y balances desde backend si disponible)
    await accountStore.getAccounts()
    newAccount.name = ''
    newAccount.initialBalance = 0
  } catch (error) {
    console.error('Error creating account:', error)
  }
}

const deleteAccount = async (id: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) {
    try {
      await accountStore.deleteAccount(id)
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
