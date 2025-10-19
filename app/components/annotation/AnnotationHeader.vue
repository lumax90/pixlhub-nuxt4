<script setup lang="ts">
import { Home, ChevronLeft, Keyboard, Moon, Sun, Settings, Bell } from 'lucide-vue-next'

const props = defineProps<{
  filename: string
  currentIndex: number
  totalImages: number
}>()

const emit = defineEmits<{
  back: []
  home: []
  toggleGrid: []
}>()

const { isDark, toggleTheme } = useTheme()
const showShortcuts = ref(false)
const showNotifications = ref(false)
const unreadCount = ref(2)

const notifications = [
  { id: 1, title: 'Review required', message: '5 annotations need your review', time: '10m ago', read: false },
  { id: 2, title: 'Task assigned', message: 'New batch of 50 images assigned', time: '1h ago', read: false },
  { id: 3, title: 'Quality check', message: 'Your annotations passed QA', time: '3h ago', read: true }
]

const shortcuts = [
  { key: 'V', action: 'Select Tool' },
  { key: 'B', action: 'Bounding Box' },
  { key: 'P', action: 'Point Tool' },
  { key: 'G', action: 'Polygon Tool' },
  { key: 'F', action: 'Freeform Tool' },
  { key: '1-5', action: 'Select Label' },
  { key: 'Del', action: 'Delete Annotation' },
  { key: 'Ctrl+Z', action: 'Undo' },
  { key: 'Ctrl+Y', action: 'Redo' },
  { key: 'Space', action: 'Pan Canvas' },
  { key: '+/-', action: 'Zoom In/Out' },
]
</script>

<template>
  <div class="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
    <!-- Left: Navigation (aligned with sidebar width) -->
    <div class="w-60 h-full flex items-center gap-2 px-3 border-r border-gray-200 dark:border-gray-800">
      <button
        @click="emit('home')"
        class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        title="Home"
      >
        <Home :size="18" :stroke-width="2" />
      </button>
      
      <button
        @click="emit('back')"
        class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        title="Back"
      >
        <ChevronLeft :size="18" :stroke-width="2" />
      </button>
    </div>
    
    <!-- Center: Filename and Counter -->
    <div class="flex items-center gap-4">
      <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
        <ChevronLeft :size="16" class="text-gray-600 dark:text-gray-400" />
      </button>
      
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ filename }}</span>
        <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-gray-600 dark:text-gray-400">
            <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <rect x="5" y="5" width="6" height="6" fill="currentColor"/>
          </svg>
        </button>
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ currentIndex }} of {{ totalImages }}</span>
      </div>
      
      <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
        <ChevronLeft :size="16" class="text-gray-600 dark:text-gray-400 rotate-180" />
      </button>
    </div>
    
    <!-- Right: Actions -->
    <div class="flex items-center gap-2 px-4">
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
      
      <div class="relative">
        <button
          @click="showShortcuts = !showShortcuts"
          class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard :size="18" :stroke-width="2" />
        </button>
        
        <!-- Shortcuts Dropdown -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 -translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-2 scale-95"
        >
          <div
            v-if="showShortcuts"
            class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
          >
            <div class="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
            </div>
            <div class="p-2 max-h-96 overflow-y-auto">
              <div
                v-for="shortcut in shortcuts"
                :key="shortcut.key"
                class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
              >
                <span class="text-xs text-gray-700 dark:text-gray-300">{{ shortcut.action }}</span>
                <kbd class="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded">
                  {{ shortcut.key }}
                </kbd>
              </div>
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
    </div>
  </div>
</template>
