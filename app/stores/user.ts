import { defineStore } from 'pinia'
import type { User, UserRole } from '~/types'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // Getters
  const userRole = computed(() => user.value?.role)
  const tenantId = computed(() => user.value?.tenantId)
  
  const isAdmin = computed(() => userRole.value === 'admin')
  const isReviewer = computed(() => userRole.value === 'reviewer' || isAdmin.value)
  const isLabeler = computed(() => userRole.value === 'labeler' || isReviewer.value)

  // Actions
  function setUser(userData: User) {
    user.value = userData
    isAuthenticated.value = true
  }

  function clearUser() {
    user.value = null
    isAuthenticated.value = false
  }

  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      // TODO: Implement actual auth API call
      // const response = await $fetch('/api/auth/login', {
      //   method: 'POST',
      //   body: { email, password }
      // })
      
      // Mock user for development
      const mockUser: User = {
        id: '1',
        email,
        name: 'Demo User',
        role: 'admin',
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setUser(mockUser)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      // TODO: Implement actual auth API call
      // await $fetch('/api/auth/logout', { method: 'POST' })
      clearUser()
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Logout failed' }
    } finally {
      isLoading.value = false
    }
  }

  function hasPermission(requiredRole: UserRole): boolean {
    if (!user.value) return false
    
    const roleHierarchy: Record<UserRole, number> = {
      observer: 1,
      labeler: 2,
      reviewer: 3,
      admin: 4
    }
    
    return roleHierarchy[user.value.role] >= roleHierarchy[requiredRole]
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    
    // Getters
    userRole,
    tenantId,
    isAdmin,
    isReviewer,
    isLabeler,
    
    // Actions
    setUser,
    clearUser,
    login,
    logout,
    hasPermission
  }
})
