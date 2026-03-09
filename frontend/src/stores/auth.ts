import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const register = async (email: string, password: string, passwordConfirm: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await authAPI.register({ email, password, passwordConfirm })
      token.value = response.data.accessToken
      user.value = response.data.user
      localStorage.setItem('token', token.value)
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
      token.value = response.data.accessToken
      user.value = response.data.user
      localStorage.setItem('token', token.value)
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
      user.value = response.data
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
