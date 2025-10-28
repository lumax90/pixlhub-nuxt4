<script setup lang="ts">
import { Bell, Check, CheckCheck, Trash2, X, BellOff, Volume2, VolumeX } from 'lucide-vue-next'
import { NButton, NIcon, NBadge, NPopover, NList, NListItem, NEmpty, NText, NSpace, NDivider, NTag, useMessage, NDropdown } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'

const props = defineProps<{
  userId: string
}>()

const notificationStore = useNotificationStore()
const router = useRouter()
const message = useMessage()

// Mute state
const isMuted = ref(false)
const mutedUntil = ref<Date | null>(null)

// Load mute state from localStorage
onMounted(() => {
  const savedMuteState = localStorage.getItem('notifications_muted')
  if (savedMuteState) {
    const muteData = JSON.parse(savedMuteState)
    mutedUntil.value = new Date(muteData.until)
    
    // Check if still muted
    if (mutedUntil.value > new Date()) {
      isMuted.value = true
    } else {
      // Expired, clear it
      localStorage.removeItem('notifications_muted')
      isMuted.value = false
      mutedUntil.value = null
    }
  }
  
  notificationStore.fetchNotifications(props.userId)
  
  // Start polling only if not muted
  let interval: NodeJS.Timeout | null = null
  if (!isMuted.value) {
    interval = notificationStore.startPolling(props.userId)
  }
  
  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (interval) clearInterval(interval)
  })
})

// Handle notification click
const handleNotificationClick = async (notification: any) => {
  // Mark as read
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id)
  }
  
  // Navigate to related page
  if (notification.projectId) {
    router.push(`/projects/${notification.projectId}`)
  } else if (notification.taskId) {
    router.push(`/annotate?task=${notification.taskId}`)
  }
}

// Mark all as read
const handleMarkAllRead = async () => {
  await notificationStore.markAllAsRead(props.userId)
  message.success('All notifications marked as read')
}

// Delete notification
const handleDelete = async (notificationId: string, event: Event) => {
  event.stopPropagation()
  await notificationStore.deleteNotification(notificationId)
  message.success('Notification deleted')
}

// Clear all notifications
const handleClearAll = async () => {
  if (notificationStore.notifications.length === 0) return
  
  await notificationStore.clearAllNotifications(props.userId)
  message.success('All notifications cleared')
}

// Format time ago
const timeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

// Get notification icon color
const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    task_assigned: 'text-blue-500',
    review_required: 'text-orange-500',
    task_completed: 'text-green-500',
    comment_added: 'text-purple-500',
    export_ready: 'text-cyan-500'
  }
  return colors[type] || 'text-gray-500'
}

// Mute notifications
const muteNotifications = (hours: number) => {
  const until = new Date()
  until.setHours(until.getHours() + hours)
  
  mutedUntil.value = until
  isMuted.value = true
  
  localStorage.setItem('notifications_muted', JSON.stringify({
    until: until.toISOString()
  }))
  
  message.success(`Notifications muted for ${hours} hour${hours > 1 ? 's' : ''}`)
}

// Unmute notifications
const unmuteNotifications = () => {
  isMuted.value = false
  mutedUntil.value = null
  localStorage.removeItem('notifications_muted')
  
  // Restart polling
  notificationStore.startPolling(props.userId)
  message.success('Notifications unmuted')
}

// Mute dropdown options
const muteOptions: DropdownOption[] = [
  {
    label: 'Mute for 1 hour',
    key: '1',
    props: {
      onClick: () => muteNotifications(1)
    }
  },
  {
    label: 'Mute for 4 hours',
    key: '4',
    props: {
      onClick: () => muteNotifications(4)
    }
  },
  {
    label: 'Mute for 8 hours',
    key: '8',
    props: {
      onClick: () => muteNotifications(8)
    }
  },
  {
    label: 'Mute for 24 hours',
    key: '24',
    props: {
      onClick: () => muteNotifications(24)
    }
  }
]
</script>

<template>
  <NPopover trigger="click" placement="bottom-end" :show-arrow="false">
    <template #trigger>
      <NBadge :value="notificationStore.unreadCount" :max="9" :show-zero="false">
        <NButton text title="Notifications">
          <template #icon>
            <NIcon :size="18">
              <Bell />
            </NIcon>
          </template>
        </NButton>
      </NBadge>
    </template>

    <div class="w-96 max-h-[500px] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <Bell :size="16" />
          <span class="font-semibold text-sm">Notifications</span>
          <NBadge v-if="notificationStore.unreadCount > 0" :value="notificationStore.unreadCount" type="info" />
          <NTag v-if="isMuted" size="tiny" type="warning">Muted</NTag>
        </div>
        
        <NSpace :size="4">
          <!-- Mark all as read -->
          <NButton
            v-if="notificationStore.unreadCount > 0"
            text
            size="tiny"
            @click="handleMarkAllRead"
            title="Mark all as read"
          >
            <template #icon>
              <CheckCheck :size="14" />
            </template>
          </NButton>
          
          <!-- Clear all -->
          <NButton
            v-if="notificationStore.notifications.length > 0"
            text
            size="tiny"
            @click="handleClearAll"
            title="Clear all notifications"
          >
            <template #icon>
              <Trash2 :size="14" class="text-red-500" />
            </template>
          </NButton>
          
          <!-- Mute/Unmute -->
          <NDropdown v-if="!isMuted" trigger="click" :options="muteOptions" placement="bottom-end">
            <NButton
              text
              size="tiny"
              title="Mute notifications"
            >
              <template #icon>
                <BellOff :size="14" />
              </template>
            </NButton>
          </NDropdown>
          
          <NButton
            v-else
            text
            size="tiny"
            @click="unmuteNotifications"
            title="Unmute notifications"
          >
            <template #icon>
              <Volume2 :size="14" />
            </template>
          </NButton>
        </NSpace>
      </div>

      <!-- Notifications List -->
      <div class="overflow-y-auto flex-1">
        <NList v-if="notificationStore.notifications.length > 0" hoverable>
          <NListItem
            v-for="notification in notificationStore.notifications"
            :key="notification.id"
            class="cursor-pointer"
            :class="[!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : '']"
            @click="handleNotificationClick(notification)"
          >
            <div class="flex items-start gap-3 py-1">
              <!-- Icon -->
              <div class="mt-1">
                <Bell :size="16" :class="getNotificationColor(notification.type)" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <span class="text-sm font-medium" :class="[!notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400']">
                    {{ notification.title }}
                  </span>
                  <span class="text-xs text-gray-500 whitespace-nowrap">
                    {{ timeAgo(notification.createdAt) }}
                  </span>
                </div>
                
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ notification.message }}
                </p>

                <!-- Project tag if available -->
                <div v-if="notification.project" class="mt-1">
                  <NTag size="tiny" type="default">
                    {{ notification.project.name }}
                  </NTag>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <NButton
                  v-if="!notification.read"
                  text
                  size="tiny"
                  @click.stop="notificationStore.markAsRead(notification.id)"
                  title="Mark as read"
                >
                  <template #icon>
                    <Check :size="14" />
                  </template>
                </NButton>
                
                <NButton
                  text
                  size="tiny"
                  @click="handleDelete(notification.id, $event)"
                  title="Delete"
                >
                  <template #icon>
                    <Trash2 :size="14" class="text-red-500" />
                  </template>
                </NButton>
              </div>
            </div>
          </NListItem>
        </NList>

        <NEmpty v-else description="No notifications" size="small" class="py-8" />
      </div>
    </div>
  </NPopover>
</template>
