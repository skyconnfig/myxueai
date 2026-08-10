import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@xueai/shared'
import { fetchMe, getStoredToken, login as apiLogin, logout as apiLogout, register as apiRegister, updateProfile as apiUpdateProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const displayName = computed(() => user.value?.name ?? user.value?.email ?? 'Guest')

  async function init() {
    if (initialized.value) return
    loading.value = true
    try {
      if (getStoredToken()) {
        user.value = await fetchMe()
      }
    } catch {
      apiLogout()
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login(email: string, password: string) {
    const { user: u } = await apiLogin(email, password)
    user.value = u
    return u
  }

  async function register(email: string, password: string, name?: string) {
    const { user: u } = await apiRegister(email, password, name)
    user.value = u
    return u
  }

  async function updateProfile(data: { name?: string; avatar?: string | null }) {
    const updated = await apiUpdateProfile(data)
    user.value = updated
    return updated
  }

  function logout() {
    apiLogout()
    user.value = null
  }

  return { user, loading, initialized, isLoggedIn, displayName, init, login, register, updateProfile, logout }
})
