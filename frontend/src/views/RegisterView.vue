<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
      <p class="text-gray-600 mb-8">Únete a MoneyMess hoy</p>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            v-model="form.email"
            type="email"
            id="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            v-model="form.password"
            type="password"
            id="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div>
          <label for="passwordConfirm" class="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña
          </label>
          <input
            v-model="form.passwordConfirm"
            type="password"
            id="passwordConfirm"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ authStore.isLoading ? 'Registrando...' : 'Registrarse' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          ¿Ya tienes cuenta?
          <router-link to="/login" class="text-indigo-600 hover:text-indigo-700 font-semibold">
            Inicia sesión aquí
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
})

const handleRegister = async () => {
  error.value = ''
  if (form.password !== form.passwordConfirm) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  try {
    await authStore.register(form.email, form.password, form.passwordConfirm)
    router.push('/dashboard')
  } catch {
    error.value = authStore.error || 'Error al registrarse'
  }
}
</script>
