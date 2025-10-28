<script setup lang="ts">
import { 
  MousePointer2, 
  SquareDashedMousePointer,
  CircleDot,
  Waypoints,
  PenTool,
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
  
  const canvasRect = canvas.getBoundingClientRect()
  
  let newX = e.clientX - dragStart.value.x
  let newY = e.clientY - dragStart.value.y
  
  // Magnetic snap threshold (in pixels)
  const snapThreshold = 20
  
  // Get the actual element dimensions (before rotation transform)
  const actualWidth = paletteRef.value.offsetWidth
  const actualHeight = paletteRef.value.offsetHeight
  
  // When rotated, the visual bounds are different from position bounds
  // because transform-origin is top-left
  if (rotation.value !== 0) {
    // Rotated -90deg: width and height swap visually
    // When rotated -90deg with origin at top-left:
    // - The top edge moves down by actualWidth
    // - The palette extends right by actualHeight
    const visualWidth = actualHeight
    const visualHeight = actualWidth
    
    // The position is the transform origin, but visually the palette extends differently
    // Top edge is at: Y - actualWidth (because it rotates up from origin)
    // So to keep top edge at 0: Y must be >= actualWidth
    const minY = actualWidth
    const maxY = canvasRect.height
    
    // Constrain bounds
    newX = Math.max(0, Math.min(newX, canvasRect.width - visualWidth))
    newY = Math.max(minY, Math.min(newY, maxY))
    
    // Snap to top edge (visual top = Y - actualWidth = 0, so Y = actualWidth)
    if (Math.abs(newY - minY) < snapThreshold) {
      newY = minY
    }
    // Snap to bottom edge (visual bottom = Y, so Y = canvasHeight)
    if (Math.abs(newY - maxY) < snapThreshold) {
      newY = maxY
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
    newX = Math.max(0, Math.min(newX, canvasRect.width - actualWidth))
    newY = Math.max(0, Math.min(newY, canvasRect.height - actualHeight))
    
    // Snap to left edge
    if (newX < snapThreshold) {
      newX = 0
    }
    // Snap to right edge
    if (newX > canvasRect.width - actualWidth - snapThreshold) {
      newX = canvasRect.width - actualWidth
    }
    // Snap to top edge
    if (newY < snapThreshold) {
      newY = 0
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
  
  // Get actual dimensions (before rotation)
  const actualWidth = paletteRef.value.offsetWidth
  const actualHeight = paletteRef.value.offsetHeight
  const canvasRect = canvas.getBoundingClientRect()
  
  // If rotating, check if it fits
  if (newRotation !== 0) {
    // After rotation: width becomes height, height becomes width
    const visualWidth = actualHeight
    const visualHeight = actualWidth
    
    // When rotated, Y position must be at least actualWidth (so top edge is at 0)
    const minY = actualWidth
    const maxY = canvasRect.height
    
    const wouldFitHorizontally = position.value.x + visualWidth <= canvasRect.width
    const wouldFitVertically = position.value.y >= minY && position.value.y <= maxY
    
    if (!wouldFitHorizontally || !wouldFitVertically) {
      // Adjust position to fit
      if (!wouldFitHorizontally) {
        position.value.x = Math.max(0, canvasRect.width - visualWidth)
      }
      if (!wouldFitVertically) {
        // Clamp between minY and maxY
        position.value.y = Math.max(minY, Math.min(position.value.y, maxY))
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
  { type: 'line', icon: PenTool, label: 'Line' },
  { type: 'freeform', icon: Pen, label: 'Freeform' },
  { type: 'comment', icon: MessageSquareDashed, label: 'Comment' }
]

const aiTools = [
  { type: 'ai-polygon', icon: Square, label: 'AI Polygon from Box', active: true },
  { type: 'auto-detect', icon: Zap, label: 'Auto Detect (Coming Soon)', active: false },
  { type: 'auto-polygon', icon: Shapes, label: 'Auto Polygon (Coming Soon)', active: false },
  { type: 'magnetic-lasso', icon: Magnet, label: 'Magnetic Lasso (Coming Soon)', active: false }
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
            @click="tool.active ? annotationStore.setTool(tool.type as any) : null"
            :disabled="!tool.active"
            :class="[
              'w-full aspect-square rounded-md border flex items-center justify-center transition-all duration-150',
              !tool.active && 'opacity-40 cursor-not-allowed',
              annotationStore.currentTool === tool.type
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : tool.active 
                  ? 'border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:shadow-sm dark:hover:shadow-md'
                  : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600'
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
