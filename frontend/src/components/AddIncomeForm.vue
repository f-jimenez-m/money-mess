<template>
  <div class="mt-3 p-3 bg-gray-50 rounded">
    <form @submit.prevent="submit" class="space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <input v-model.number="form.amount" type="number" min="0" placeholder="Monto" required class="border px-2 py-1 rounded" />
        <input v-model="form.date" type="date" class="border px-2 py-1 rounded" />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <select v-model="form.categoryId" class="border px-2 py-1 rounded">
          <option value="">-- Categoría --</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="form.description" placeholder="Descripción (ej. L800)" class="border px-2 py-1 rounded" />
      </div>

      <div class="flex items-center space-x-2">
        <button type="submit" class="px-3 py-1 bg-green-600 text-white rounded">Añadir ingreso</button>
        <button type="button" @click="$emit('cancel')" class="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { categoriesAPI } from '@/api/categories'
import { transactionsAPI } from '@/api/transactions'
import { toast, Swal } from '@/plugins/notifications'

const props = defineProps<{ accountId: string }>()
const emit = defineEmits(['created', 'cancel'])

const categories = ref<any[]>([])
const form = ref({ amount: 0, description: '', categoryId: '', date: new Date().toISOString().substr(0,10) })

onMounted(async () => {
  try {
    const res = await categoriesAPI.getCategories()
    // filtrar solo INCOME
    categories.value = res.data?.data?.filter((c: any) => c.type === 'INCOME') ?? []
  } catch (err) {
    // ignore
  }
})

const submit = async () => {
  try {
    await transactionsAPI.createTransaction({
      amount: Number(form.value.amount),
      description: form.value.description,
      type: 'income',
      accountId: props.accountId,
      categoryId: form.value.categoryId || undefined,
      date: form.value.date,
    })
    toast.success('Ingreso añadido')
    emit('created')
  } catch (err: any) {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.error || 'No se pudo crear ingreso' })
  }
}
</script>
