<script setup lang="ts">
import { Check } from 'lucide-vue-next'

const annotationStore = useAnnotationStore()
</script>

<template>
  <div class="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
      Labels
    </h3>
    
    <div class="space-y-2">
      <button
        v-for="label in annotationStore.labels"
        :key="label.id"
        @click="annotationStore.setSelectedLabel(label.id)"
        :class="[
          'w-full flex items-center gap-3 p-2 rounded-sm transition-colors',
          annotationStore.selectedLabelId === label.id
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'hover:bg-gray-50 dark:hover:bg-gray-750'
        ]"
      >
        <div
          class="w-4 h-4 rounded-sm flex-shrink-0"
          :style="{ backgroundColor: label.color }"
        />
        
        <span class="flex-1 text-left text-sm text-gray-900 dark:text-gray-100">
          {{ label.name }}
        </span>
        
        <kbd
          v-if="label.hotkey"
          class="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded"
        >
          {{ label.hotkey }}
        </kbd>
        
        <Check
          v-if="annotationStore.selectedLabelId === label.id"
          :size="16"
          class="text-pixl-blue"
        />
      </button>
    </div>
    
    <div v-if="annotationStore.labels.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
      No labels defined
    </div>
  </div>
</template>
