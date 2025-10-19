<script setup lang="ts">
import { RefreshCw, Shuffle } from 'lucide-vue-next'
import type { Label } from '~/types'

const annotationStore = useAnnotationStore()

const props = defineProps<{
  labels: Label[]
}>()

const objectsHeight = ref(160) // 40 * 4 = h-40 in pixels
const isResizing = ref(false)

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  const newHeight = window.innerHeight - e.clientY - 56 // 56px for header
  objectsHeight.value = Math.max(100, Math.min(400, newHeight))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}
</script>

<template>
  <div class="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
    <!-- Labels Section -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <div class="px-3 py-2.5 flex items-center justify-between">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Labels ({{ labels.length }})
        </h3>
        <div class="flex items-center gap-1">
          <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <RefreshCw :size="12" class="text-gray-500 dark:text-gray-400" />
          </button>
          <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <Shuffle :size="12" class="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <div>
          <button
            v-for="label in labels"
            :key="label.id"
            @click="annotationStore.setSelectedLabel(label.id)"
            :class="[
              'w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
              annotationStore.selectedLabelId === label.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500 pl-[10px]' : ''
            ]"
          >
            <span class="flex-1 text-left text-xs font-medium text-gray-900 dark:text-gray-100">
              {{ label.name }}
            </span>
            <div class="flex items-center gap-2 pr-1">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ backgroundColor: label.color }"
              />
              <span class="text-xs text-gray-400 dark:text-gray-500 font-mono w-4 text-right">
                {{ label.hotkey }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Objects Section -->
    <div class="border-t border-gray-200 dark:border-gray-800">
      <!-- Resize Handle -->
      <div
        @mousedown="startResize"
        class="h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
        :class="isResizing ? 'bg-blue-500' : ''"
      />
      <div class="px-3 py-2.5 flex items-center justify-between">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Objects ({{ annotationStore.annotations.length }})
        </h3>
        <div class="flex items-center gap-1">
          <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" class="text-gray-500 dark:text-gray-400">
              <rect x="2" y="2" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
              <rect x="8" y="2" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
              <rect x="2" y="8" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
              <rect x="8" y="8" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" class="text-gray-500 dark:text-gray-400">
              <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" stroke-width="1"/>
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1"/>
              <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="overflow-y-auto" :style="{ height: `${objectsHeight}px` }">
        <div v-if="annotationStore.annotations.length === 0" class="px-3 py-8 text-center">
          <p class="text-xs text-gray-400 dark:text-gray-500">No annotations yet</p>
        </div>
        
        <div v-else>
          <button
            v-for="ann in annotationStore.annotations"
            :key="ann.id"
            @click="annotationStore.selectAnnotation(ann.id)"
            :class="[
              'w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left',
              annotationStore.selectedAnnotationId === ann.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500 pl-[10px]' : ''
            ]"
          >
            <span class="flex-1 text-xs font-medium text-gray-900 dark:text-gray-100">
              {{ labels.find(l => l.id === ann.labelId)?.name || 'Unknown' }}
            </span>
            <div class="flex items-center gap-2 pr-1">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ backgroundColor: labels.find(l => l.id === ann.labelId)?.color || '#gray' }"
              />
              <span class="text-xs text-gray-400 dark:text-gray-500 font-mono min-w-[32px] text-right">
                {{ ann.type }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
