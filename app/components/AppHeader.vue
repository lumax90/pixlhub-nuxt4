<script setup lang="ts">
import { LayoutDashboard, FolderOpen, Moon, Sun, User, Bell } from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()
const route = useRoute()

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderOpen }
]

const isActive = (path: string) => route.path === path

// Notifications
const showNotifications = ref(false)
const unreadCount = ref(3)

const notifications = [
  { id: 1, title: 'Task completed', message: 'Project "Street Signs" has been completed', time: '5m ago', read: false },
  { id: 2, title: 'New assignment', message: 'You have been assigned to "Vehicle Detection"', time: '1h ago', read: false },
  { id: 3, title: 'Review required', message: '12 annotations need your review', time: '2h ago', read: false },
  { id: 4, title: 'Project updated', message: 'Guidelines updated for "Pedestrian Tracking"', time: '1d ago', read: true }
]
</script>

<template>
  <header class="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div class="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
      <!-- Left: Logo + Navigation -->
      <div class="flex items-center gap-6">
        <!-- Logo -->
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="relative">
            <div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">PixlHub</span>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Data Labeling</span>
          </div>
        </NuxtLink>
        
        <!-- Navigation -->
        <nav class="flex items-center gap-6">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2">
        <!-- Notifications -->
        <div class="relative">
          <button
            @click="showNotifications = !showNotifications"
            class="relative p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Notifications"
          >
            <Bell :size="18" :stroke-width="2" />
            <span
              v-if="unreadCount > 0"
              class="absolute top-1 right-1 min-w-[10px] h-2.5 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none"
            >
              {{ unreadCount }}
            </span>
          </button>
          
          <!-- Notifications Dropdown -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in"
            enter-from-class="opacity-0 -translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-95"
          >
            <div
              v-if="showNotifications"
              class="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
            >
              <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                <button class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <button
                  v-for="notif in notifications"
                  :key="notif.id"
                  class="w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <div class="flex items-start gap-2">
                    <div
                      v-if="!notif.read"
                      class="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ notif.title }}</p>
                      <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{{ notif.message }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ notif.time }}</p>
                    </div>
                  </div>
                </button>
              </div>
              <div class="p-2 border-t border-gray-200 dark:border-gray-700">
                <button class="w-full text-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-1.5">
                  View all notifications
                </button>
              </div>
            </div>
          </Transition>
        </div>
        
        <button
          @click="toggleTheme()"
          class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Toggle Theme"
        >
          <component 
            :is="isDark ? Sun : Moon" 
            :size="18" 
            :stroke-width="2"
            :key="isDark ? 'sun' : 'moon'"
          />
        </button>
        
        <button
          class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Profile"
        >
          <User :size="18" :stroke-width="2" />
        </button>
      </div>
    </div>
  </header>
</template>
