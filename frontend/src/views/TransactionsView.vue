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
      <h2 class="text-3xl font-bold text-gray-900 mb-8">Transacciones</h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow p-6">
            <div v-if="transactionStore.isLoading" class="text-center py-12">
              <p class="text-gray-600">Cargando transacciones...</p>
            </div>
            <div v-else-if="transactionStore.transactions.length === 0" class="text-center py-12">
              <p class="text-gray-600">No hay transacciones</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="transaction in transactionStore.transactions"
                :key="transaction.id"
                class="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p class="font-semibold text-gray-900">{{ transaction.description }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(transaction.date) }}</p>
                </div>
                <p
                  :class="{
                    'text-green-600': transaction.type === 'income',
                    'text-red-600': transaction.type === 'expense',
                  }"
                  class="text-lg font-bold"
                >
                  {{ transaction.type === 'income' ? '+' : '-' }}${{ transaction.amount.toFixed(2) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Nueva Transacción</h3>
            <form @submit.prevent="createTransaction" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  v-model="newTransaction.description"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  v-model="newTransaction.type"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  v-model.number="newTransaction.amount"
                  type="number"
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  v-model="newTransaction.date"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
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
import { useTransactionStore } from '@/stores/transaction'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()

const newTransaction = reactive({
  description: '',
  type: 'expense' as const,
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  accountId: '',
  categoryId: '',
})

onMounted(async () => {
  try {
    await transactionStore.getTransactions()
  } catch (error) {
    console.error('Error loading transactions:', error)
  }
})

const createTransaction = async () => {
  if (!newTransaction.accountId || !newTransaction.categoryId) {
    alert('Por favor selecciona una cuenta y categoría')
    return
  }

  try {
    await transactionStore.createTransaction({
      description: newTransaction.description,
      type: newTransaction.type,
      amount: newTransaction.amount,
      date: newTransaction.date,
      accountId: newTransaction.accountId,
      categoryId: newTransaction.categoryId,
    })
    newTransaction.description = ''
    newTransaction.amount = 0
    newTransaction.date = new Date().toISOString().split('T')[0]
  } catch (error) {
    console.error('Error creating transaction:', error)
  }
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('es-ES')

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
