<script setup lang="ts">
import type { Label, CanvasImage, Project } from '~/types'

definePageMeta({
  layout: false
})

const route = useRoute()
const annotationStore = useAnnotationStore()
const commentStore = useCommentStore()
const projectStore = useProjectStore()
const showSettings = ref(false)

// Get project ID and task ID from query params
const projectId = computed(() => route.query.project as string)
const taskId = computed(() => route.query.task as string)

// Load project from store
const currentProject = computed(() => {
  return projectStore.projects.find(p => p.id === projectId.value) || null
})

// Current task and asset
const currentTask = ref<any>(null)
const currentAsset = ref<CanvasImage | null>(null)
const isLoadingTask = ref(true)

// Ref to the annotation workspace (to call save methods)
const workspaceRef = ref<any>(null)

// Labels will be loaded from API
const labels = ref<Label[]>([])
const isLoadingLabels = ref(true)

// Load task from API
const loadTask = async () => {
  if (!taskId.value) {
    console.error('No task ID provided')
    return
  }
  
  isLoadingTask.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/tasks/${taskId.value}`)
    if (response.success && response.data) {
      currentTask.value = response.data
      
      // Convert asset to CanvasImage format
      if (response.data.asset) {
        // Transform database annotations to canvas format
        const transformedAnnotations = (response.data.annotations || []).map((ann: any) => ({
          id: ann.id,
          labelId: ann.labelId,
          type: ann.type,
          bbox: ann.data?.bbox || null,
          polygon: ann.data?.polygon || null,
          point: ann.data?.point || null,
          visible: true
        }))
        
        currentAsset.value = {
          id: response.data.asset.id,
          name: response.data.asset.name,
          url: response.data.asset.url,
          width: response.data.asset.metadata?.width || 1920,
          height: response.data.asset.metadata?.height || 1080,
          annotations: transformedAnnotations
        }
        
        // Set image in annotation store if project is image type
        if (currentProject.value?.toolType === 'image') {
          annotationStore.setImage(currentAsset.value)
        }
      }
    }
  } catch (error) {
    console.error('Error loading task:', error)
  } finally {
    isLoadingTask.value = false
  }
}

// Watch for task changes and update comment store
watch(taskId, (newTaskId) => {
  if (newTaskId) {
    commentStore.setCurrentTask(newTaskId)
  }
}, { immediate: true })

// Fetch data on mount
onMounted(async () => {
  // Load project first, then task
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }
  await loadTask()
})

// Load labels from API
const loadLabels = async () => {
  isLoadingLabels.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/projects/labels/${projectId.value}`)
    if (response.success && response.data) {
      // Use full LabelClass data including attributes
      labels.value = response.data.classes
        .map((cls: any) => ({
          id: cls.id,
          projectId: response.data.projectId,
          name: cls.name,
          color: cls.color,
          description: cls.description,
          hotkey: cls.shortcut,
          order: cls.order,
          attributes: cls.attributes || [] // Include attributes from schema
        }))
        .sort((a: any, b: any) => a.order - b.order) // Sort by order field
      
      annotationStore.setLabels(labels.value, projectId.value)
      
      // Restore last selected label from localStorage
      const lastSelectedLabel = localStorage.getItem(`lastSelectedLabel_${projectId.value}`)
      if (lastSelectedLabel && labels.value.find(l => l.id === lastSelectedLabel)) {
        annotationStore.setSelectedLabel(lastSelectedLabel)
      }
    }
  } catch (error) {
    console.error('Failed to load labels:', error)
  } finally {
    isLoadingLabels.value = false
  }
}

// Keyboard shortcuts
function handleKeyPress(e: KeyboardEvent) {
  // Label shortcuts (1-9) - use hotkey field, not position
  if (e.key >= '1' && e.key <= '9') {
    const label = labels.value.find(l => l.hotkey === e.key)
    if (label) {
      annotationStore.setSelectedLabel(label.id)
    }
  }
  
  // Tool shortcuts
  if (e.key === 'v') annotationStore.setTool('select')
  if (e.key === 'b') annotationStore.setTool('bbox')
  if (e.key === 'p') annotationStore.setTool('point')
  if (e.key === 'g') annotationStore.setTool('polygon')
  
  // Undo/Redo
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    annotationStore.undo()
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    annotationStore.redo()
  }
  
  // Delete selected annotation
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (annotationStore.selectedAnnotationId) {
      e.preventDefault()
      annotationStore.deleteAnnotation(annotationStore.selectedAnnotationId)
    }
  }
}

// Initialize annotation tool when project is ready
watch(currentProject, async (project) => {
  if (project) {
    await loadLabels()
  }
}, { immediate: true })

// Add keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

// Handle save text annotations event from header
const handleSaveTextAnnotations = async () => {
  if (workspaceRef.value?.saveAnnotations) {
    await workspaceRef.value.saveAnnotations()
  }
}

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  annotationStore.reset()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <AnnotationHeader
      :filename="currentAsset?.name || 'Loading...'"
      :current-index="1"
      :total-images="1"
      :project-id="projectId"
      :task-id="taskId"
      :project="currentProject"
      @save-text-annotations="handleSaveTextAnnotations"
    />

    <!-- Main Content -->
    <div v-if="!currentProject" class="flex-1 flex items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">Loading project...</p>
    </div>
    
    <!-- Image Tool Layout (with sidebars and palette) -->
    <div v-else-if="currentProject.toolType === 'image'" class="flex-1 flex overflow-hidden relative">
      <!-- Left Sidebar -->
      <AnnotationSidebar :labels="labels" />
      
      <!-- Canvas Area -->
      <div class="flex-1 relative bg-gray-100 dark:bg-gray-900">
        <!-- Dynamic Tool Workspace -->
        <AnnotationWorkspace :project="currentProject" />
        
        <!-- Tool Palette -->
        <AnnotationToolPalette />
      </div>
      
      <!-- Right Drawer -->
      <AnnotationRightDrawer />
    </div>
    
    <!-- Text/Classification/Sentiment Tools Layout (full width, no sidebars) -->
    <div v-else class="flex-1 overflow-hidden relative">
      <AnnotationWorkspace ref="workspaceRef" :project="currentProject" />
    </div>
    
    <!-- Comment Dialogs -->
    <AnnotationCommentDialog />
    <AnnotationCommentViewDialog />
    
    <!-- Floating Settings Button (only for image annotation) -->
    <AnnotationSettingsButton 
      v-if="currentProject?.toolType === 'image'"
      @click="showSettings = !showSettings" 
    />
    
    <!-- Settings Panel - Floating (only for image annotation) -->
    <AnnotationSettingsPanel
      v-if="currentProject?.toolType === 'image'"
      :is-open="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>
