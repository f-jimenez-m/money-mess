<template>
  <div class="p-6">
    <h2 class="text-2xl font-semibold mb-4">Recurrentes</h2>

    <div class="mb-4 flex items-center space-x-2">
      <button @click="fetchRules" class="px-4 py-2 bg-indigo-600 text-white rounded">Refrescar</button>
      <button @click="showNew" class="px-4 py-2 bg-green-600 text-white rounded">Nueva regla</button>
    </div>

    <div v-if="loading" class="text-gray-600">Cargando...</div>

    <table v-else class="w-full table-auto border-collapse">
      <thead>
        <tr class="text-left">
          <th class="p-2">Nombre</th>
          <th class="p-2">Monto</th>
          <th class="p-2">Frecuencia</th>
          <th class="p-2">Inicio</th>
          <th class="p-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rules" :key="r.id" class="border-t">
          <td class="p-2">{{ r.name }}</td>
          <td class="p-2">{{ r.amount ?? '-' }}</td>
          <td class="p-2">{{ r.frequency ?? '-' }}</td>
          <td class="p-2">{{ r.startDate ? (new Date(r.startDate)).toLocaleDateString() : '-' }}</td>
          <td class="p-2">
            <div class="flex items-center gap-2">
              <button @click="editRule(r)" class="px-3 py-1 bg-yellow-500 text-white rounded">Editar</button>
              <button @click="executeRule(r.id)" class="px-3 py-1 bg-indigo-500 text-white rounded">Generar</button>
              <button @click="remove(r.id)" class="px-3 py-1 bg-red-500 text-white rounded">Eliminar</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="mt-6 bg-white p-4 rounded shadow">
      <h3 class="font-semibold mb-2">Nueva regla recurrente</h3>
      <form @submit.prevent="createRule" class="space-y-3">
        <div>
          <label class="block text-sm">Nombre</label>
          <input v-model="form.name" class="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label class="block text-sm">Tipo</label>
          <select v-model="form.type" class="w-full border px-2 py-1 rounded">
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
          </select>
        </div>
        <div>
          <label class="block text-sm">Cuenta</label>
          <select v-model="form.accountId" class="w-full border px-2 py-1 rounded">
            <option value="">-- Seleccionar cuenta --</option>
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm">Monto</label>
          <input v-model.number="form.amount" type="number" class="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label class="block text-sm">Frecuencia</label>
          <select v-model="form.frequency" class="w-full border px-2 py-1 rounded">
            <option value="MONTHLY">Mensual</option>
            <option value="WEEKLY">Semanal</option>
            <option value="YEARLY">Anual</option>
          </select>
        </div>
        <div>
          <label class="block text-sm">Categoría</label>
          <select v-model="form.categoryId" class="w-full border px-2 py-1 rounded">
            <option value="">-- Opcional --</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm">Día del mes (opcional)</label>
          <input v-model.number="form.dayOfMonth" type="number" min="1" max="31" class="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label class="block text-sm">Start Date</label>
          <input v-model="form.startDate" type="date" class="w-full border px-2 py-1 rounded" />
        </div>
            <div class="flex space-x-2">
              <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded">Crear</button>
              <button type="button" @click="cancel" class="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
            </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { recurringAPI, RecurringRule } from '@/api/recurring'
import { toast, Swal } from '@/plugins/notifications'
import { useAccountStore } from '@/stores/account'
import { categoriesAPI } from '@/api/categories'

const rules = ref<RecurringRule[]>([])
const loading = ref(false)
const showForm = ref(false)

const accountStore = useAccountStore()
const accounts = ref<any[]>([])
const categories = ref<any[]>([])

const editingId = ref<string | null>(null)

const form = reactive<Partial<RecurringRule>>({
  name: '',
  type: 'EXPENSE',
  amount: 0,
  frequency: 'MONTHLY',
  startDate: new Date().toISOString().substr(0, 10),
  accountId: undefined,
  categoryId: undefined,
  dayOfMonth: undefined,
})

const fetchRules = async () => {
  loading.value = true
  try {
    const res = await recurringAPI.getAll()
    rules.value = res.data?.data ?? []
  } catch (err: any) {
    toast.error('Error al cargar recurrentes')
  } finally {
    loading.value = false
  }
}

const fetchAux = async () => {
  try {
    await accountStore.getAccounts()
    accounts.value = accountStore.accounts
  } catch {}

  try {
    const res = await categoriesAPI.getCategories()
    categories.value = res.data?.data ?? []
  } catch {}
}

const showNew = () => {
  showForm.value = true
}

const cancel = () => {
  showForm.value = false
}

const createRule = async () => {
  try {
    const payload = { ...form }
    if (editingId.value) {
      await recurringAPI.update(editingId.value, payload)
      toast.success('Regla actualizada')
      editingId.value = null
    } else {
      await recurringAPI.create(payload)
      toast.success('Regla creada')
    }
    showForm.value = false
    fetchRules()
  } catch (err: any) {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.error || 'No se pudo crear' })
  }
}

const editRule = (r: RecurringRule) => {
  editingId.value = r.id
  form.name = r.name
  form.type = r.type
  form.amount = r.amount
  form.frequency = r.frequency
  form.startDate = r.startDate ? r.startDate.substr(0,10) : new Date().toISOString().substr(0,10)
  form.accountId = r.accountId
  form.categoryId = r.categoryId
  form.dayOfMonth = r.dayOfMonth
  showForm.value = true
}

const executeRule = async (id: string) => {
  try {
    await recurringAPI.execute({ ruleId: id })
    toast.success('Generación ejecutada')
    fetchRules()
  } catch (err: any) {
    toast.error('Error al ejecutar')
  }
}

const remove = async (id: string) => {
  const res = await Swal.fire({ title: 'Confirmar', text: 'Eliminar regla?', showCancelButton: true })
  if (res.isConfirmed) {
    try {
      await recurringAPI.delete(id)
      toast.success('Eliminada')
      fetchRules()
    } catch (err: any) {
      toast.error('Error al eliminar')
    }
  }
}

onMounted(() => {
  fetchRules()
  fetchAux()
})
</script>

<style scoped>
table td, table th { border-bottom: 1px solid #e5e7eb }
</style>
