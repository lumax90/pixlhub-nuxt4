<script setup lang="ts">
import { X, Check } from 'lucide-vue-next'
import { NButton, NIcon, NEmpty, useMessage } from 'naive-ui'
import type { Label, CanvasImage, Project } from '~/types'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const annotationStore = useAnnotationStore()
const commentStore = useCommentStore()
const projectStore = useProjectStore()
const message = useMessage()
const showSettings = ref(false)

// Get project ID from query params
const projectId = computed(() => route.query.project as string)
const taskId = ref<string | null>(null)

// Load project from store
const currentProject = computed(() => {
  return projectStore.projects.find(p => p.id === projectId.value) || null
})

// Current task and asset
const currentTask = ref<any>(null)
const currentAsset = ref<CanvasImage | null>(null)
const isLoadingTask = ref(true)

// Labels will be loaded from API
const labels = ref<Label[]>([])
const isLoadingLabels = ref(true)

// Review state
const isReviewing = ref(false)
const reviewAction = ref<'approve' | 'reject' | null>(null)

// Get next task from review queue
const getNextReviewTask = async () => {
  if (!projectId.value) return
  
  try {
    const response = await $fetch<{ success: boolean; data?: any; message?: string }>(`/api/tasks/next?projectId=${projectId.value}&status=review`)
    
    if (response.success && response.data) {
      taskId.value = response.data.id
      await loadTask(response.data.id)
    } else {
      // No more tasks - redirect to project
      router.push(`/projects/${projectId.value}`)
    }
  } catch (error) {
    console.error('Error getting next task:', error)
    message.error('Failed to load next task')
  }
}

// Load task from API
const loadTask = async (id: string) => {
  if (!id) {
    console.error('No task ID provided')
    return
  }
  
  isLoadingTask.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/tasks/${id}`)
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
          // Disable editing in review mode
          annotationStore.setTool('select')
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
})

// Fetch data on mount
onMounted(async () => {
  // Load project first
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }
  await loadLabels()
  // Get first task from review queue
  await getNextReviewTask()
})

// Load labels from API
const loadLabels = async () => {
  isLoadingLabels.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/projects/labels/${projectId.value}`)
    if (response.success && response.data) {
      labels.value = response.data.classes.map((cls: any) => ({
        id: cls.id,
        projectId: response.data.projectId,
        name: cls.name,
        color: cls.color,
        shortcut: cls.shortcut,
        attributes: cls.attributes || []
      }))
      annotationStore.setLabels(labels.value)
    }
  } catch (error) {
    console.error('Error loading labels:', error)
  } finally {
    isLoadingLabels.value = false
  }
}

// Handle review actions
const handleApprove = async () => {
  if (!currentTask.value) return
  
  isReviewing.value = true
  reviewAction.value = 'approve'
  
  try {
    // Update task status to completed
    const response = await $fetch(`/api/tasks/${taskId.value}/review`, {
      method: 'POST',
      body: {
        action: 'approve'
      }
    })
    
    if (response.success) {
      // Get next task in review queue
      await getNextReviewTask()
    }
  } catch (error) {
    console.error('Error approving task:', error)
    message.error('Failed to approve task')
  } finally {
    isReviewing.value = false
    reviewAction.value = null
  }
}

const handleReject = async () => {
  if (!currentTask.value) return
  
  isReviewing.value = true
  reviewAction.value = 'reject'
  
  try {
    // Update task status back to label
    const response = await $fetch(`/api/tasks/${taskId.value}/review`, {
      method: 'POST',
      body: {
        action: 'reject'
      }
    })
    
    if (response.success) {
      // Get next task in review queue
      await getNextReviewTask()
    }
  } catch (error) {
    console.error('Error rejecting task:', error)
    message.error('Failed to reject task')
  } finally {
    isReviewing.value = false
    reviewAction.value = null
  }
}

const handleBack = () => {
  router.push(`/projects/${projectId.value}`)
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <AnnotationHeader
      :filename="currentAsset?.name || 'Loading...'"
      :current-index="1"
      :total-images="1"
      :project-id="projectId"
      :task-id="taskId || undefined"
      :project="currentProject"
      @back="handleBack"
    >
      <!-- Replace Submit button with Review actions -->
      <template #actions>
        <div class="flex items-center gap-2 px-4">
          <NButton
            type="error"
            size="small"
            @click="handleReject"
            :loading="isReviewing && reviewAction === 'reject'"
            :disabled="isReviewing"
          >
            <template #icon>
              <NIcon><X /></NIcon>
            </template>
            Reject
          </NButton>
          
          <NButton
            type="success"
            size="small"
            @click="handleApprove"
            :loading="isReviewing && reviewAction === 'approve'"
            :disabled="isReviewing"
          >
            <template #icon>
              <NIcon><Check /></NIcon>
            </template>
            Approve & Next
          </NButton>
        </div>
      </template>
    </AnnotationHeader>

    <!-- Main Content -->
    <!-- Image Tool Layout (with sidebars) -->
    <div v-if="currentProject?.toolType === 'image'" class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar -->
      <AnnotationSidebar :labels="labels" :is-loading="isLoadingLabels" :read-only="true" />

      <!-- Center: Canvas -->
      <div class="flex-1 flex flex-col">
        <AnnotationToolsImageAnnotationTool :read-only="true" />
      </div>

      <!-- Right Drawer -->
      <AnnotationRightDrawer />
    </div>
    
    <!-- Text/Other Tools Layout (full width, no sidebars) -->
    <div v-else-if="currentProject" class="flex-1 overflow-hidden relative">
      <AnnotationWorkspace :project="currentProject" :task-id="taskId || undefined" :read-only="true" />
    </div>
    
    <!-- Loading State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <p class="text-gray-500">Loading project...</p>
    </div>

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
