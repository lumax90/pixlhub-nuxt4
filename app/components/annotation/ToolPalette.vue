<script setup lang="ts">
import { 
  MousePointer2, 
  SquareDashedMousePointer,
  CircleDot,
  Waypoints,
  Pen,
  MessageSquareDashed,
  ChevronDown,
  GripVertical,
  RotateCw,
  Zap,
  Shapes,
  Square,
  Magnet
} from 'lucide-vue-next'

const annotationStore = useAnnotationStore()
const isExpanded = ref(false)
const rotation = ref(0)
const position = ref({ x: 16, y: 16 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const paletteRef = ref<HTMLElement | null>(null)

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value || !paletteRef.value) return
  
  e.preventDefault()
  
  const canvas = paletteRef.value.parentElement
  if (!canvas) return
  
  const paletteRect = paletteRef.value.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  
  let newX = e.clientX - dragStart.value.x
  let newY = e.clientY - dragStart.value.y
  
  // Magnetic snap threshold (in pixels)
  const snapThreshold = 20
  
  // When rotated, the visual bounds are different from position bounds
  // because transform-origin is top-left
  if (rotation.value !== 0) {
    // Rotated 90deg: height becomes width visually
    const visualWidth = paletteRect.width
    const visualHeight = paletteRect.height
    
    // Constrain bounds accounting for rotation
    newX = Math.max(0, Math.min(newX, canvasRect.width - visualWidth))
    newY = Math.max(0, Math.min(newY, canvasRect.height - visualHeight))
    
    // Snap to top edge
    if (newY < snapThreshold) {
      newY = 0
    }
    // Snap to bottom edge
    if (newY > canvasRect.height - visualHeight - snapThreshold) {
      newY = canvasRect.height - visualHeight
    }
    // Snap to left edge
    if (newX < snapThreshold) {
      newX = 0
    }
    // Snap to right edge
    if (newX > canvasRect.width - visualWidth - snapThreshold) {
      newX = canvasRect.width - visualWidth
    }
  } else {
    // Normal vertical orientation
    newX = Math.max(0, Math.min(newX, canvasRect.width - paletteRect.width))
    newY = Math.max(0, Math.min(newY, canvasRect.height - paletteRect.height))
    
    // Snap to left edge
    if (newX < snapThreshold) {
      newX = 0
    }
    // Snap to right edge
    if (newX > canvasRect.width - paletteRect.width - snapThreshold) {
      newX = canvasRect.width - paletteRect.width
    }
  }
  
  // Use requestAnimationFrame for smooth dragging
  requestAnimationFrame(() => {
    position.value = { x: newX, y: newY }
  })
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const toggleOrientation = () => {
  if (!paletteRef.value) return
  
  const canvas = paletteRef.value.parentElement
  if (!canvas) return
  
  const newRotation = rotation.value === 0 ? -90 : 0
  
  // Check if rotation would go outside bounds
  const paletteRect = paletteRef.value.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  
  // If rotating, check if it fits
  if (newRotation !== 0) {
    const wouldFitHorizontally = position.value.x + paletteRect.height <= canvasRect.width
    const wouldFitVertically = position.value.y + paletteRect.width <= canvasRect.height
    
    if (!wouldFitHorizontally || !wouldFitVertically) {
      // Adjust position to fit
      if (!wouldFitHorizontally) {
        position.value.x = Math.max(0, canvasRect.width - paletteRect.height)
      }
      if (!wouldFitVertically) {
        position.value.y = Math.max(0, canvasRect.height - paletteRect.width)
      }
    }
  }
  
  rotation.value = newRotation
}

const tools = [
  { type: 'select', icon: MousePointer2, label: 'Select' },
  { type: 'bbox', icon: SquareDashedMousePointer, label: 'Bounding Box' },
  { type: 'point', icon: CircleDot, label: 'Point' },
  { type: 'polygon', icon: Waypoints, label: 'Polygon' },
  { type: 'freeform', icon: Pen, label: 'Freeform' },
  { type: 'comment', icon: MessageSquareDashed, label: 'Comment' }
]

const aiTools = [
  { type: 'auto-detect', icon: Zap, label: 'Auto Detect' },
  { type: 'auto-polygon', icon: Shapes, label: 'Auto Polygon' },
  { type: 'polygon-from-box', icon: Square, label: 'Polygon from Box' },
  { type: 'magnetic-lasso', icon: Magnet, label: 'Magnetic Lasso' }
]
</script>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

<template>
  <div
    ref="paletteRef"
    :style="{ 
      left: `${position.x}px`, 
      top: `${position.y}px`,
      transform: `rotate(${rotation}deg)`,
      transformOrigin: 'top left'
    }"
    class="absolute z-10 
    bg-white/80 dark:bg-gray-800/80 backdrop-blur-md
    border border-gray-200 dark:border-gray-700 
    rounded-lg shadow-lg p-1.5 gap-1 select-none flex flex-col w-min"
    :class="[
      isDragging ? 'cursor-grabbing' : '',
      isDragging ? '' : rotation !== 0 ? 'transition-transform duration-500' : 'transition-all duration-300'
    ]"
  >
    <!-- Header (drag + rotate icon area) -->
    <div class="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500 py-0.5">
      <button
        @mousedown="startDrag"
        class="cursor-grab hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Drag to move"
      >
        <GripVertical :size="12" :style="{ transform: `rotate(${-rotation}deg)` }" class="transition-transform duration-500" />
      </button>
      <button
        @click="toggleOrientation"
        class="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-500"
        title="Rotate palette"
      >
        <RotateCw :size="10" :style="{ transform: `rotate(${-rotation}deg)` }" class="transition-transform duration-500" />
      </button>
    </div>

    <!-- Tools -->
    <div class="flex flex-col gap-1">
      <button
        v-for="tool in tools"
        :key="tool.type"
        @click="annotationStore.setTool(tool.type as any)"
        :class="[
          'w-full aspect-square rounded-md border flex items-center justify-center transition-all duration-150',
          annotationStore.currentTool === tool.type
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm dark:hover:shadow-md'
        ]"
        :title="tool.label"
      >
        <component :is="tool.icon" :size="16" :style="{ transform: `rotate(${-rotation}deg)` }" class="transition-transform duration-500" />
      </button>

      <!-- Expand Notch -->
      <div
        @click="isExpanded = !isExpanded"
        class="w-full h-1.5 bg-purple-200 dark:bg-purple-900/40 rounded-full cursor-pointer 
               hover:bg-purple-300 dark:hover:bg-purple-900/60 transition-all duration-300 
               flex items-center justify-center"
        title="Expand AI Tools"
      >
        <ChevronDown
          :size="9"
          class="text-purple-700 dark:text-purple-400 transition-transform duration-500"
          :style="{ transform: `rotate(${isExpanded ? 180 : 0}deg) rotate(${-rotation}deg)` }"
        />
      </div>

      <!-- AI Tools -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-95"
      >
        <div v-if="isExpanded" class="flex flex-col gap-1">
          <button
            v-for="(tool, index) in aiTools"
            :key="tool.type"
            @click="annotationStore.setTool(tool.type as any)"
            :class="[
              'w-full aspect-square rounded-md border flex items-center justify-center transition-all duration-150',
              annotationStore.currentTool === tool.type
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:shadow-sm dark:hover:shadow-md'
            ]"
            :style="{ 
              transitionDelay: `${index * 30}ms`,
              animation: isExpanded ? `slideIn 300ms ease-out ${index * 30}ms both` : 'none'
            }"
            :title="tool.label"
          >
            <component :is="tool.icon" :size="16" :style="{ transform: `rotate(${-rotation}deg)` }" class="transition-transform duration-500" />
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>
