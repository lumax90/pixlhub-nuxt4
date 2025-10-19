<script setup lang="ts">
import type { Annotation, BoundingBox } from '~/types'
import VueKonva from 'vue-konva'
import { getCurrentInstance } from 'vue'

// Register vue-konva components
const instance = getCurrentInstance()
if (instance && !instance.appContext.app.component('v-stage')) {
  instance.appContext.app.use(VueKonva)
}

const annotationStore = useAnnotationStore()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<any>(null)
const loadedImage = ref<HTMLImageElement | null>(null)

// Drawing state
const isDrawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const currentRect = ref<BoundingBox | null>(null)

// Load image when currentImage changes
watch(() => annotationStore.currentImage, async (newImage) => {
  if (!newImage) {
    return
  }
  
  console.log('🖼️ Loading image:', newImage.url)
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.src = newImage.url
  
  img.onload = () => {
    console.log('✅ Image loaded successfully:', img.width, 'x', img.height)
    loadedImage.value = img
  }
  
  img.onerror = (e) => {
    console.error('❌ Failed to load image:', e)
  }
})

// Update canvas size on mount and resize
onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

function updateCanvasSize() {
  if (!containerRef.value) return
  
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  
  annotationStore.setCanvasSize(width, height)
}

// Stage config
const stageConfig = computed(() => ({
  width: annotationStore.canvasSize.width,
  height: annotationStore.canvasSize.height
}))

// Get mouse position relative to stage (accounting for zoom/pan)
function getStagePointerPosition(e: any) {
  const stage = stageRef.value?.getNode()
  if (!stage) return null
  
  const pos = stage.getPointerPosition()
  if (!pos) return null
  
  // Account for canvas transform (zoom/pan)
  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  return transform.point(pos)
}

// Mouse event handlers
function handleMouseDown(e: any) {
  const stage = e.target.getStage()
  if (!stage) return
  
  // If clicking on stage background (not an annotation)
  if (e.target === stage) {
    // Deselect if in select mode
    if (annotationStore.currentTool === 'select') {
      annotationStore.selectAnnotation(null)
      return
    }
    
    // Start drawing bbox
    if (annotationStore.currentTool === 'bbox' && annotationStore.selectedLabelId) {
      const pos = getStagePointerPosition(e)
      if (!pos) return
      
      isDrawing.value = true
      startPoint.value = pos
      currentRect.value = {
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0
      }
    }
  }
}

function handleMouseMove(e: any) {
  if (!isDrawing.value || !currentRect.value) return
  
  const pos = getStagePointerPosition(e)
  if (!pos) return
  
  // Update current rect
  currentRect.value = {
    x: Math.min(startPoint.value.x, pos.x),
    y: Math.min(startPoint.value.y, pos.y),
    width: Math.abs(pos.x - startPoint.value.x),
    height: Math.abs(pos.y - startPoint.value.y)
  }
}

function handleMouseUp(e: any) {
  if (!isDrawing.value || !currentRect.value) return
  
  // Only create annotation if bbox is large enough (min 5px)
  if (currentRect.value.width > 5 && currentRect.value.height > 5 && annotationStore.selectedLabelId) {
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bounding-box',
      labelId: annotationStore.selectedLabelId,
      bbox: { ...currentRect.value },
      visible: true,
      createdAt: new Date(),
      taskId: '',
      createdBy: '',
      updatedAt: new Date()
    }
    
    annotationStore.addAnnotation(newAnnotation)
  }
  
  // Reset drawing state
  isDrawing.value = false
  currentRect.value = null
}

// Handle annotation click
function handleAnnotationClick(annotation: Annotation) {
  annotationStore.selectAnnotation(annotation.id)
}

// Handle annotation drag
function handleAnnotationDragEnd(annotation: Annotation, e: any) {
  const node = e.target
  annotationStore.updateAnnotation(annotation.id, {
    bbox: {
      ...annotation.bbox!,
      x: node.x(),
      y: node.y()
    }
  })
}

// Get label color
function getLabelColor(labelId: string): string {
  const label = annotationStore.labels.find((l: any) => l.id === labelId)
  return label?.color || '#2563EB'
}

// Handle wheel for zoom
function handleWheel(e: any) {
  e.evt.preventDefault()
  
  const stage = stageRef.value?.getNode()
  if (!stage) return
  
  const oldScale = annotationStore.canvasTransform.scale
  const pointer = stage.getPointerPosition()
  
  const scaleBy = 1.1
  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
  
  // Clamp scale
  const clampedScale = Math.max(0.1, Math.min(5, newScale))
  
  // Calculate new position to zoom towards mouse
  const mousePointTo = {
    x: (pointer.x - annotationStore.canvasTransform.x) / oldScale,
    y: (pointer.y - annotationStore.canvasTransform.y) / oldScale
  }
  
  annotationStore.setCanvasTransform({
    scale: clampedScale,
    x: pointer.x - mousePointTo.x * clampedScale,
    y: pointer.y - mousePointTo.y * clampedScale
  })
}
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full bg-gray-100 dark:bg-gray-900">
    <ClientOnly>
    <v-stage
      v-if="loadedImage"
      ref="stageRef"
      :config="stageConfig"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      class="cursor-crosshair"
    >
      <v-layer
        :config="{
          x: annotationStore.canvasTransform.x,
          y: annotationStore.canvasTransform.y,
          scaleX: annotationStore.canvasTransform.scale,
          scaleY: annotationStore.canvasTransform.scale
        }"
      >
        <!-- Main Image -->
        <v-image
          :config="{
            image: loadedImage,
            x: (annotationStore.canvasSize.width - annotationStore.scaledImageSize.width) / 2,
            y: (annotationStore.canvasSize.height - annotationStore.scaledImageSize.height) / 2,
            width: annotationStore.scaledImageSize.width,
            height: annotationStore.scaledImageSize.height
          }"
        />
        
        <!-- Existing Annotations -->
        <v-rect
          v-for="ann in annotationStore.annotations.filter((a: Annotation) => a.visible && a.bbox)"
          :key="ann.id"
          :config="{
            x: ann.bbox!.x + (annotationStore.canvasSize.width - annotationStore.scaledImageSize.width) / 2,
            y: ann.bbox!.y + (annotationStore.canvasSize.height - annotationStore.scaledImageSize.height) / 2,
            width: ann.bbox!.width,
            height: ann.bbox!.height,
            stroke: getLabelColor(ann.labelId),
            strokeWidth: annotationStore.selectedAnnotationId === ann.id ? 3 : 2,
            fill: getLabelColor(ann.labelId) + '20',
            draggable: annotationStore.currentTool === 'select'
          }"
          @click="() => handleAnnotationClick(ann)"
          @dragend="(e: any) => handleAnnotationDragEnd(ann, e)"
        />
        
        <!-- Drawing Preview -->
        <v-rect
          v-if="currentRect"
          :config="{
            x: currentRect.x + (annotationStore.canvasSize.width - annotationStore.scaledImageSize.width) / 2,
            y: currentRect.y + (annotationStore.canvasSize.height - annotationStore.scaledImageSize.height) / 2,
            width: currentRect.width,
            height: currentRect.height,
            stroke: '#2563EB',
            strokeWidth: 2,
            dash: [5, 5],
            fill: '#2563EB20'
          }"
        />
      </v-layer>
    </v-stage>
    </ClientOnly>
  </div>
</template>
