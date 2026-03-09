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
      <h2 class="text-3xl font-bold text-gray-900 mb-8">Dashboard Financiero</h2>

      <div v-if="accountStore.isLoading" class="text-center py-12">
        <p class="text-gray-600">Cargando datos...</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Balance Total</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">
            ${{ totalBalance.toFixed(2) }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total Ingresos</p>
          <p class="text-3xl font-bold text-green-600 mt-2">
            ${{ totalIncome.toFixed(2) }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total Gastos</p>
          <p class="text-3xl font-bold text-red-600 mt-2">
            ${{ totalExpense.toFixed(2) }}
          </p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Cuentas</h3>
        <div v-if="accountStore.accounts.length === 0" class="text-gray-600">
          No hay cuentas. <router-link to="/accounts" class="text-indigo-600 hover:underline">Crear una</router-link>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="account in accountStore.accounts"
            :key="account.id"
            class="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-semibold text-gray-900">{{ account.name }}</p>
              <p class="text-sm text-gray-600">{{ account.type }}</p>
            </div>
            <p class="text-xl font-bold text-indigo-600">{{ account.currency }} {{ account.initialBalance.toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountStore } from '@/stores/account'
import { useTransactionStore } from '@/stores/transaction'

const router = useRouter()
const authStore = useAuthStore()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()

onMounted(async () => {
  try {
    await accountStore.getAccounts()
    await transactionStore.getTransactions()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

const totalBalance = computed(() =>
  accountStore.accounts.reduce((sum, acc) => sum + acc.initialBalance, 0)
)

const totalIncome = computed(() => transactionStore.totalIncome)
const totalExpense = computed(() => transactionStore.totalExpense)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
