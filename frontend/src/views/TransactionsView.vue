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
                  {{ transaction.type === 'income' ? '+' : '-' }}${{ Math.abs(transaction.amount).toFixed(2) }}
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                <select
                  v-model="newTransaction.accountId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  <option v-for="acc in accountStore.accounts" :key="acc.id" :value="acc.id">
                    {{ acc.name }} ({{ acc.currency }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  v-model="newTransaction.categoryId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }} ({{ cat.type }})
                  </option>
                </select>
                <div v-if="categories.length === 0" class="mt-2">
                  <button @click.prevent="createDefaultCategories" :disabled="creatingDefaults" class="text-sm text-indigo-600 underline">
                    {{ creatingDefaults ? 'Creando categorías...' : 'Crear categorías sugeridas' }}
                  </button>
                </div>
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
import { useAccountStore } from '@/stores/account'
import { categoriesAPI, Category } from '@/api/categories'
import { ref } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const accountStore = useAccountStore()
const categories = ref<Category[]>([])
const creatingDefaults = ref(false)

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
    await accountStore.getAccounts()
    await transactionStore.getTransactions()
    const res = await categoriesAPI.getCategories()
    categories.value = res.data?.data ?? []
  } catch (error) {
    console.error('Error loading transactions/accounts/categories:', error)
  }
})

const createTransaction = async () => {
  if (!newTransaction.accountId || !newTransaction.categoryId) {
    alert('Por favor selecciona una cuenta y categoría')
    return
  }

  // Allow past dates: backend accepts `allowPastDate` flag (sent from the store)

  try {
    await transactionStore.createTransaction({
      description: newTransaction.description,
      type: newTransaction.type,
      amount: newTransaction.amount,
      date: newTransaction.date,
      accountId: newTransaction.accountId,
      categoryId: newTransaction.categoryId || undefined,
    })
    newTransaction.description = ''
    newTransaction.amount = 0
    newTransaction.date = new Date().toISOString().split('T')[0]
  } catch (error) {
    console.error('Error creating transaction:', error)
  }
}

const formatDate = (date?: string | null) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES')
}

const createDefaultCategories = async () => {
  if (creatingDefaults.value) return
  creatingDefaults.value = true
  try {
    // Verificar que hay token local
    const token = localStorage.getItem('token')
    if (!token || token === 'undefined') {
      alert('No estás autenticado. Por favor inicia sesión.')
      authStore.logout()
      router.push('/login')
      return
    }
    const defaults = [
      { name: 'Alimentos', type: 'EXPENSE', color: '#F87171' },
      { name: 'Transporte', type: 'EXPENSE', color: '#FBBF24' },
      { name: 'Servicios', type: 'EXPENSE', color: '#60A5FA' },
      { name: 'Entretenimiento', type: 'EXPENSE', color: '#A78BFA' },
      { name: 'Salario', type: 'INCOME', color: '#34D399' },
    ]

    for (const c of defaults) {
      try {
        await categoriesAPI.createCategory(c as any)
      } catch (e: any) {
        if (e?.response?.status === 401) {
          alert('Sesión expirada. Por favor inicia sesión de nuevo.')
          authStore.logout()
          router.push('/login')
          return
        }
        // ignore other individual create errors
      }
    }

    const res = await categoriesAPI.getCategories()
    categories.value = res.data?.data ?? []
  } catch (e) {
    console.error('Error creando categorías por defecto', e)
  } finally {
    creatingDefaults.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
