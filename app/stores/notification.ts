import { defineStore } from 'pinia'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  projectId?: string
  taskId?: string
  data?: any
  read: boolean
  readAt?: string
  createdAt: string
  project?: {
    id: string
    name: string
  }
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
    unreadCount: 0,
    isLoading: false,
    lastFetch: null as Date | null
  }),

  getters: {
    unreadNotifications: (state) => state.notifications.filter(n => !n.read),
    readNotifications: (state) => state.notifications.filter(n => n.read),
    hasUnread: (state) => state.unreadCount > 0
  },

  actions: {
    async fetchNotifications(userId: string) {
      this.isLoading = true
      try {
        const response = await $fetch<{ success: boolean; data: Notification[]; unreadCount: number }>(
          `/api/notifications?userId=${userId}`
        )
        
        if (response.success) {
          this.notifications = response.data
          this.unreadCount = response.unreadCount
          this.lastFetch = new Date()
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        this.isLoading = false
      }
    },

    async markAsRead(notificationId: string) {
      try {
        const response = await $fetch<{ success: boolean }>(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH'
        })
        
        if (response.success) {
          const notification = this.notifications.find(n => n.id === notificationId)
          if (notification) {
            notification.read = true
            notification.readAt = new Date().toISOString()
            this.unreadCount = Math.max(0, this.unreadCount - 1)
          }
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },

    async markAllAsRead(userId: string) {
      try {
        const response = await $fetch<{ success: boolean }>(`/api/notifications/mark-all-read`, {
          method: 'PATCH',
          body: { userId }
        })
        
        if (response.success) {
          this.notifications.forEach(n => {
            n.read = true
            n.readAt = new Date().toISOString()
          })
          this.unreadCount = 0
        }
      } catch (error) {
        console.error('Failed to mark all as read:', error)
      }
    },

    async deleteNotification(notificationId: string) {
      try {
        const response = await $fetch<{ success: boolean }>(`/api/notifications/${notificationId}`, {
          method: 'DELETE'
        })
        
        if (response.success) {
          const notification = this.notifications.find(n => n.id === notificationId)
          if (notification && !notification.read) {
            this.unreadCount = Math.max(0, this.unreadCount - 1)
          }
          this.notifications = this.notifications.filter(n => n.id !== notificationId)
        }
      } catch (error) {
        console.error('Failed to delete notification:', error)
      }
    },

    async clearAllNotifications(userId: string) {
      try {
        const response = await $fetch<{ success: boolean }>(`/api/notifications/clear-all`, {
          method: 'DELETE',
          body: { userId }
        })
        
        if (response.success) {
          this.notifications = []
          this.unreadCount = 0
        }
      } catch (error) {
        console.error('Failed to clear all notifications:', error)
      }
    },

    async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'>) {
      try {
        const response = await $fetch<{ success: boolean; data: Notification }>('/api/notifications', {
          method: 'POST',
          body: notification
        })
        
        if (response.success) {
          this.notifications.unshift(response.data)
          this.unreadCount++
        }
      } catch (error) {
        console.error('Failed to create notification:', error)
      }
    },

    // Auto-refresh notifications every 30 seconds
    startPolling(userId: string) {
      this.fetchNotifications(userId)
      
      const interval = setInterval(() => {
        this.fetchNotifications(userId)
      }, 30000) // 30 seconds
      
      return interval
    }
  }
})
