<script setup lang="ts">
import {
  Square,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo,
  Redo,
  Sparkles
} from 'lucide-vue-next'

const annotationStore = useAnnotationStore()

const tools = [
  { name: 'select', icon: MousePointer, label: 'Select (V)' },
  { name: 'bbox', icon: Square, label: 'Bounding Box (B)' }
]
</script>

<template>
  <div class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
    <!-- Tools -->
    <div class="flex items-center gap-2">
      <button
        v-for="tool in tools"
        :key="tool.name"
        @click="annotationStore.setTool(tool.name as any)"
        :class="[
          'p-2 rounded-sm transition-colors relative',
          annotationStore.currentTool === tool.name
            ? 'bg-pixl-blue text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        ]"
        :title="tool.label"
      >
        <component :is="tool.icon" :size="20" />
      </button>
    </div>
    
    <div class="h-8 w-px bg-gray-200 dark:bg-gray-700" />
    
    <!-- Zoom Controls -->
    <div class="flex items-center gap-2">
      <button
        @click="annotationStore.zoomIn"
        class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        title="Zoom In"
      >
        <ZoomIn :size="20" />
      </button>
      
      <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
        {{ Math.round(annotationStore.canvasTransform.scale * 100) }}%
      </span>
      
      <button
        @click="annotationStore.zoomOut"
        class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        title="Zoom Out"
      >
        <ZoomOut :size="20" />
      </button>
      
      <button
        @click="annotationStore.resetZoom"
        class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        title="Fit to Screen"
      >
        <Maximize :size="20" />
      </button>
    </div>
    
    <div class="h-8 w-px bg-gray-200 dark:bg-gray-700" />
    
    <!-- History -->
    <div class="flex items-center gap-2">
      <button
        @click="annotationStore.undo"
        :disabled="!annotationStore.canUndo"
        :class="[
          'p-2 rounded-sm transition-colors',
          annotationStore.canUndo
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        ]"
        title="Undo (Ctrl+Z)"
      >
        <Undo :size="20" />
      </button>
      
      <button
        @click="annotationStore.redo"
        :disabled="!annotationStore.canRedo"
        :class="[
          'p-2 rounded-sm transition-colors',
          annotationStore.canRedo
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        ]"
        title="Redo (Ctrl+Y)"
      >
        <Redo :size="20" />
      </button>
    </div>
    
    <div class="flex-1" />
    
    <!-- Info -->
    <div class="text-sm text-gray-600 dark:text-gray-400">
      {{ annotationStore.annotations.length }} annotation{{ annotationStore.annotations.length !== 1 ? 's' : '' }}
    </div>
  </div>
</template>
