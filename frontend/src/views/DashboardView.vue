<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-indigo-600">MoneyMess</h1>
        <div class="flex gap-6 items-center">
          <router-link to="/dashboard" class="text-gray-600 hover:text-indigo-600">Dashboard</router-link>
          <router-link to="/transactions" class="text-gray-600 hover:text-indigo-600">Transacciones</router-link>
          <router-link to="/recurring" class="text-gray-600 hover:text-indigo-600">Recurrentes</router-link>
          <router-link to="/accounts" class="text-gray-600 hover:text-indigo-600">Cuentas</router-link>
          <button @click="handleLogout" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">Cerrar sesión</button>
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
          <p class="text-3xl font-bold text-gray-900 mt-2">${{ totalBalance.toFixed(2) }}</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total Ingresos</p>
          <p class="text-3xl font-bold text-green-600 mt-2">${{ totalIncome.toFixed(2) }}</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total Gastos</p>
          <p class="text-3xl font-bold text-red-600 mt-2">${{ totalExpense.toFixed(2) }}</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Cuentas</h3>
        <div v-if="accountStore.accounts.length === 0" class="text-gray-600">
          No hay cuentas. <router-link to="/accounts" class="text-indigo-600 hover:underline">Crear una</router-link>
          <router-link to="/recurring" class="ml-2 text-indigo-600 hover:underline">Recurrentes</router-link>
        </div>
        <div v-else class="space-y-4">
          <div v-for="account in accountStore.accounts" :key="account.id" class="p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-semibold text-gray-900">{{ account.name }}</p>
                <p class="text-sm text-gray-600">{{ account.type }}</p>
              </div>
              <div class="flex items-center space-x-3">
                <p class="text-xl font-bold text-indigo-600">{{ account.currency }} {{ (account.initialBalance ?? 0).toFixed(2) }}</p>
                <button @click="toggleAddIncome(account.id)" class="px-3 py-1 bg-green-500 text-white rounded">Añadir ingreso</button>
              </div>
            </div>
            <div v-if="activeAddIncome === account.id">
              <AddIncomeForm :accountId="account.id" @created="onIncomeCreated" @cancel="() => (activeAddIncome = null)" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Proyección mensual</h3>
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-600">Meses:</label>
            <select v-model="months" class="border rounded px-2 py-1">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
            </select>
            <button @click="loadProjection" class="px-3 py-1 bg-indigo-600 text-white rounded">Actualizar</button>
          </div>
        </div>

        <div v-if="projLoading" class="text-gray-600">Cargando proyección...</div>

        <div v-else>
          <div v-if="projections.length === 0" class="text-gray-600">No hay datos de proyección.</div>

          <div v-else class="space-y-4">
            <div v-for="p of projections" :key="p.accountId" class="border rounded p-3">
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-semibold">{{ p.accountName }}</p>
                  <p class="text-sm text-gray-600">Cuenta: {{ p.accountId }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">Meses proyectados: {{ months }}</p>
                </div>
              </div>

              <table class="w-full mt-3 table-auto text-sm">
                <thead>
                  <tr class="text-left text-xs text-gray-600">
                    <th class="p-1">Mes</th>
                    <th class="p-1">Saldo inicial</th>
                    <th class="p-1">Ingresos</th>
                    <th class="p-1">Gastos</th>
                    <th class="p-1">Saldo final</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="p.monthly" class="border-t">
                    <td class="p-1">{{ p.monthly.month }}</td>
                    <td class="p-1">{{ formatCurrency(p.monthly.startingBalance) }}</td>
                    <td class="p-1">{{ formatCurrency(p.monthly.income) }}</td>
                    <td class="p-1">{{ formatCurrency(p.monthly.expense) }}</td>
                    <td class="p-1">{{ formatCurrency(p.monthly.endingBalance) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountStore } from '@/stores/account'
import { useTransactionStore } from '@/stores/transaction'
import { projectionAPI } from '@/api/projection'
import { toast } from '@/plugins/notifications'

const router = useRouter()
const authStore = useAuthStore()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()

import AddIncomeForm from '@/components/AddIncomeForm.vue'

const months = ref<number>(3)
const projections = ref<any[]>([])
const projLoading = ref(false)
const activeAddIncome = ref<string | null>(null)

onMounted(async () => {
  try {
    await accountStore.getAccounts()
    await transactionStore.getTransactions()
    await loadProjection()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

// Balance total mostrado: por conveniencia mostramos ingresos - gastos (incluye pendientes)
const totalBalance = computed(() =>
  (transactionStore.totalIncome ?? 0) - (transactionStore.totalExpense ?? 0)
)

const totalIncome = computed(() => transactionStore.totalIncome)
const totalExpense = computed(() => transactionStore.totalExpense)

const formatCurrency = (val: any) => {
  if (val == null) return '$0'
  const n = typeof val === 'object' && val.toFixed ? Number(val.toFixed(2)) : Number(val)
  return `$ ${n.toLocaleString('es-CL')}`
}

const loadProjection = async () => {
  projLoading.value = true
  try {
    const res = await projectionAPI.getMonthly(months.value)
    projections.value = res.data?.data?.accounts ?? []
  } catch (err: any) {
    toast.error('Error cargando proyección')
  } finally {
    projLoading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleAddIncome = (id: string) => {
  activeAddIncome.value = activeAddIncome.value === id ? null : id
}

const onIncomeCreated = async () => {
  activeAddIncome.value = null
  await transactionStore.getTransactions()
  toast.success('Ingreso registrado')
}
</script>
