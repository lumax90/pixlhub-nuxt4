<script setup lang="ts">
import { MessageSquare, FileText, Database, Info, ChevronLeft, ChevronRight } from 'lucide-vue-next'

type TabType = 'comments' | 'guidelines' | 'dataset' | 'information'

const activeTab = ref<TabType | null>(null)

const tabs = [
  { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
  { id: 'guidelines' as const, label: 'Guidelines', icon: FileText },
  { id: 'dataset' as const, label: 'Dataset', icon: Database },
  { id: 'information' as const, label: 'Information', icon: Info }
]

const toggleTab = (tabId: TabType) => {
  activeTab.value = activeTab.value === tabId ? null : tabId
}

const closeDrawer = () => {
  activeTab.value = null
}
</script>

<template>
  <div class="relative h-full">
    <!-- Expanded Panel (Overlay) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 translate-x-full"
      enter-to-class="opacity-100 translate-x-0"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-full"
    >
      <div
        v-if="activeTab"
        class="absolute top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-lg z-10"
        style="right: 32px;"
      >
        <!-- Panel Header -->
        <div class="h-14 px-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {{ activeTab }}
          </h3>
          <button
            @click="closeDrawer"
            class="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <!-- Panel Content -->
        <div class="flex-1 overflow-y-auto p-3">
          <!-- Comments Content -->
          <div v-if="activeTab === 'comments'" class="space-y-3">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              No comments yet
            </div>
          </div>

          <!-- Guidelines Content -->
          <div v-if="activeTab === 'guidelines'" class="space-y-3">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <h4 class="font-semibold mb-2">Annotation Guidelines</h4>
              <p class="text-gray-500 dark:text-gray-400">
                Guidelines will appear here
              </p>
            </div>
          </div>

          <!-- Dataset Content -->
          <div v-if="activeTab === 'dataset'" class="space-y-3">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <h4 class="font-semibold mb-2">Dataset Information</h4>
              <p class="text-gray-500 dark:text-gray-400">
                Dataset details will appear here
              </p>
            </div>
          </div>

          <!-- Information Content -->
          <div v-if="activeTab === 'information'" class="space-y-3">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <h4 class="font-semibold mb-2">Image Information</h4>
              <p class="text-gray-500 dark:text-gray-400">
                Image metadata will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Tab Bar -->
    <div class="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full" style="width: 32px;">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="toggleTab(tab.id)"
        :class="[
          'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors relative',
          activeTab === tab.id
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        ]"
        :title="tab.label"
      >
        <!-- Active Indicator -->
        <div
          v-if="activeTab === tab.id"
          class="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
        />
        
        <!-- Icon -->
        <component :is="tab.icon" :size="16" :stroke-width="2" />
        
        <!-- Vertical Text -->
        <div class="writing-mode-vertical text-[9px] font-medium tracking-wide">
          {{ tab.label }}
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
</style>
