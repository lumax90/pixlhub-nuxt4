<script setup lang="ts">
import type { Label, CanvasImage } from '~/types'

definePageMeta({
  layout: false,
  ssr: false  // Disable SSR for canvas rendering
})

const annotationStore = useAnnotationStore()
const showSettings = ref(false)

// Demo labels
const demoLabels: Label[] = [
  { id: '1', projectId: '1', name: 'Person', color: '#ef4444', hotkey: '1', order: 1 },
  { id: '2', projectId: '1', name: 'Car', color: '#3b82f6', hotkey: '2', order: 2 },
  { id: '3', projectId: '1', name: 'Bike', color: '#10b981', hotkey: '3', order: 3 },
  { id: '4', projectId: '1', name: 'Dog', color: '#f59e0b', hotkey: '4', order: 4 },
  { id: '5', projectId: '1', name: 'Cat', color: '#8b5cf6', hotkey: '5', order: 5 }
]

// Demo image (high quality test image)
const demoImage: CanvasImage = {
  id: 'demo-1',
  name: 'demo-image.jpg',
  url: 'https://picsum.photos/1920/1080',
  width: 1920,
  height: 1080,
  annotations: []
}

// Initialize on mount
onMounted(() => {
  console.log('🎯 Initializing annotation tool...')
  annotationStore.setLabels(demoLabels)
  console.log('✅ Labels set:', demoLabels.length)
  annotationStore.setImage(demoImage)
  console.log('✅ Image set:', demoImage.url)
})

// Cleanup on unmount
onUnmounted(() => {
  annotationStore.reset()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <AnnotationHeader
      filename="indir.png"
      :current-index="1"
      :total-images="1"
      @back="() => {}"
      @home="() => {}"
      @toggle-grid="() => {}"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left Sidebar -->
      <AnnotationSidebar :labels="demoLabels" />
      
      <!-- Canvas Area -->
      <div class="flex-1 relative bg-gray-100 dark:bg-gray-900">
        <AnnotationCanvas />
        
        <!-- Tool Palette -->
        <AnnotationToolPalette />
      </div>
      
      <!-- Right Drawer -->
      <AnnotationRightDrawer />
    </div>
    
    <!-- Floating Settings Button -->
    <AnnotationSettingsButton @click="showSettings = !showSettings" />
    
    <!-- Settings Panel - Floating -->
    <AnnotationSettingsPanel
      :is-open="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>
