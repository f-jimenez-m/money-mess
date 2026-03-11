import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const rawToken = localStorage.getItem('token')
  const token = ref<string | null>(rawToken && rawToken !== 'undefined' ? rawToken : null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const register = async (email: string, password: string, passwordConfirm: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await authAPI.register({ email, password, passwordConfirm })
      // backend devuelve { success, message, data: { accessToken, user } }
      token.value = response.data?.data?.accessToken ?? null
      user.value = response.data?.data?.user ?? null
      if (token.value) localStorage.setItem('token', token.value)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al registrarse'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await authAPI.login({ email, password })
      // backend devuelve { success, message, data: { accessToken, user } }
      token.value = response.data?.data?.accessToken ?? null
      user.value = response.data?.data?.user ?? null
      if (token.value) localStorage.setItem('token', token.value)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al iniciar sesión'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const checkAuth = async () => {
    if (!token.value) {
      user.value = null
      return
    }
    
    try {
      const response = await authAPI.getProfile()
      // backend devuelve { success, data: user }
      user.value = response.data?.data ?? null
    } catch {
      logout()
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    checkAuth,
    logout,
  }
})
