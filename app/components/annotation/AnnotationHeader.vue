<script setup lang="ts">
import { Home, ChevronLeft, Keyboard, Moon, Sun, Settings, Bell, Save, Clock, CloudOff, Cloud } from 'lucide-vue-next'
import { NButton, NIcon, NDropdown, NBadge, NPopover, NList, NListItem, useMessage } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import { addToSyncQueue, removeFromQueue } from '~/utils/syncQueue'
import { useSyncService } from '~/composables/useSyncService'

const props = defineProps<{
  filename: string
  currentIndex: number
  totalImages: number
  projectId?: string
  taskId?: string
  project?: any
}>()

// Timer
const timer = props.taskId ? useTaskTimer(props.taskId) : null

// Sync service
const { pendingCount, syncNow } = useSyncService()

// Fetch queue stats
const queueStats = ref({
  labelQueue: 0,
  reviewQueue: 0,
  completedQueue: 0,
  currentTaskNumber: 0,
  totalTasks: 0,
  tasksRemaining: 0
})

const loadQueueStats = async () => {
  if (!props.projectId) return
  
  try {
    const url = `/api/tasks/queue-stats?projectId=${props.projectId}${props.taskId ? `&taskId=${props.taskId}` : ''}`
    const response = await fetch(url)
    const result = await response.json()
    
    if (result.success) {
      queueStats.value = {
        labelQueue: result.data.labelQueue || 0,
        reviewQueue: result.data.reviewQueue || 0,
        completedQueue: result.data.completedQueue || 0,
        currentTaskNumber: result.data.currentTaskNumber || 1,
        totalTasks: result.data.totalTasks || 0,
        tasksRemaining: result.data.tasksRemaining || 0
      }
    }
  } catch (error) {
    console.error('Failed to load queue stats:', error)
  }
}

// Load stats on mount and when taskId or projectId changes
watch(() => [props.taskId, props.projectId], () => {
  if (props.projectId) {
    loadQueueStats()
  }
}, { immediate: true })

const emit = defineEmits<{
  back: []
  home: []
  toggleGrid: []
  saveTextAnnotations: []
}>()

const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const annotationStore = useAnnotationStore()
const message = useMessage()

const isSaving = ref(false)

// Submit annotations and go to next task
const handleSave = async () => {
  // Check if it's an image tool or text tool
  const isImageTool = props.project?.toolType === 'image'
  
  if (isImageTool && !annotationStore.currentImage) {
    message.warning('No image loaded')
    return
  }
  
  if (!props.taskId) {
    message.error('No task ID provided')
    return
  }
  
  isSaving.value = true
  try {
    // Save timer first
    if (timer) {
      await timer.finalSave()
    }

    // For image tools, use annotation store
    if (isImageTool) {
      const annotations = annotationStore.annotations
      
      // Allow empty submissions (for negative samples / images with no objects)
      // Convert annotations to API format
      const annotationsData = annotations.map((annotation) => {
        return {
          labelId: annotation.labelId,
          type: annotation.type,
          data: {
            bbox: annotation.bbox,
            polygon: annotation.polygon,
            point: annotation.point,
            line: annotation.line,
            attributes: annotation.attributes || {}
          }
        }
      })
      
      // Add to sync queue FIRST (instant, never fails)
      await addToSyncQueue(props.taskId!, props.projectId!, annotationsData)
      
      // Try to save to database immediately
      try {
        const response = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: props.taskId,
            annotations: annotationsData
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        // Verify response
        const result = await response.json()
        if (!result.success) {
          throw new Error('API returned success: false')
        }
        
        const count = result.data?.count ?? annotationsData.length
        console.log('✅ Annotations saved to DB:', count, 'items')
        
        // Update task status to "review"
        const statusResponse = await fetch(`/api/tasks/${props.taskId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'review' })
        })
        
        if (!statusResponse.ok) {
          throw new Error('Failed to update task status')
        }
        
        console.log('✅ Task status updated to review')
        
        // Success - remove from queue
        await removeFromQueue(props.taskId!)
        
        // Clear localStorage after successful save
        localStorage.removeItem('pixlhub-annotations')
        
        console.log('✅ Removed from sync queue')
      } catch (dbError) {
        // Database save failed, but data is safe in IndexedDB queue
        // Background sync will retry
        console.warn('⚠️ DB save failed, queued for sync:', dbError)
        message.warning('Saved locally, will sync when online')
      }
    } else {
      // For text tools, emit event to parent to save
      emit('saveTextAnnotations')
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Get next task (navigate even if DB save failed)
    const nextTaskResponse = await fetch(`/api/tasks/next?projectId=${props.projectId}&status=label`)
    const nextTaskResult = await nextTaskResponse.json()
    
    if (nextTaskResult.success && nextTaskResult.data) {
      // Navigate to next task
      router.push(`/annotate?project=${props.projectId}&task=${nextTaskResult.data.id}`)
    } else {
      // No more tasks, go back to project
      router.push(`/projects/${props.projectId}`)
    }
  } catch (error) {
    message.error('Failed to submit')
    console.error('Submit error:', error)
  } finally {
    isSaving.value = false
  }
}

// Navigation handlers
const handleHome = () => {
  router.push('/dashboard')
}

const handleBack = () => {
  if (props.projectId) {
    router.push(`/projects/${props.projectId}`)
  } else {
    router.push('/projects')
  }
}

// Navigation between tasks
const goToPrevious = async () => {
  if (!props.projectId) return
  
  try {
    const response = await fetch(`/api/tasks/previous?projectId=${props.projectId}&currentTaskId=${props.taskId}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      router.push(`/annotate?project=${props.projectId}&task=${result.data.id}`)
    }
  } catch (error) {
    console.error('Failed to get previous task:', error)
  }
}

const goToNext = async () => {
  if (!props.projectId) return
  
  try {
    const response = await fetch(`/api/tasks/next?projectId=${props.projectId}&currentTaskId=${props.taskId}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      router.push(`/annotate?project=${props.projectId}&task=${result.data.id}`)
    }
  } catch (error) {
    console.error('Failed to get next task:', error)
  }
}

const shortcutOptions: DropdownOption[] = [
  {
    type: 'group',
    label: 'Keyboard Shortcuts',
    key: 'header',
    children: [
      { label: 'V - Select Tool', key: '1' },
      { label: 'B - Bounding Box', key: '2' },
      { label: 'P - Point Tool', key: '3' },
      { label: 'G - Polygon Tool', key: '4' },
      { label: '1-5 - Select Label', key: '5' },
      { label: 'Del - Delete Annotation', key: '6' },
      { label: 'Ctrl+Z - Undo', key: '7' },
      { label: 'Ctrl+Y - Redo', key: '8' }
    ]
  }
]
</script>

<template>
  <div class="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
    <!-- Left: Navigation (aligned with sidebar width) -->
    <div class="w-60 h-full flex items-center gap-2 px-3 border-r border-gray-200 dark:border-gray-800">
      <NButton text @click="handleHome" title="Dashboard">
        <template #icon>
          <NIcon :size="18"><Home /></NIcon>
        </template>
      </NButton>
      
      <NButton text @click="handleBack" title="Back to Project">
        <template #icon>
          <NIcon :size="18"><ChevronLeft /></NIcon>
        </template>
      </NButton>
    </div>
    
    <!-- Center: Filename and Counter -->
    <div class="flex items-center gap-4">
      <button 
        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        @click="goToPrevious"
        :disabled="queueStats.currentTaskNumber <= 1"
        title="Previous Task"
      >
        <ChevronLeft :size="16" class="text-gray-600 dark:text-gray-400" />
      </button>
      
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ filename }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ queueStats.currentTaskNumber }}/{{ queueStats.totalTasks }}
        </span>
      </div>
      
      <button 
        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        @click="goToNext"
        :disabled="queueStats.currentTaskNumber >= queueStats.totalTasks"
        title="Next Task"
      >
        <ChevronLeft :size="16" class="text-gray-600 dark:text-gray-400 rotate-180" />
      </button>
    </div>
    
    <!-- Right: Actions -->
    <slot name="actions">
      <div class="flex items-center gap-2 px-4">
        <!-- Sync Status Indicator -->
        <NPopover v-if="pendingCount > 0" trigger="hover" placement="bottom">
          <template #trigger>
            <NBadge :value="pendingCount" :max="99">
              <NButton text title="Pending Syncs" @click="syncNow">
                <template #icon>
                  <NIcon :size="18" class="text-orange-500">
                    <CloudOff />
                  </NIcon>
                </template>
              </NButton>
            </NBadge>
          </template>
          <div class="text-sm">
            <p class="font-medium mb-1">{{ pendingCount }} task(s) pending sync</p>
            <p class="text-gray-500 dark:text-gray-400">Will retry automatically</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Click to sync now</p>
          </div>
        </NPopover>
        
        <!-- Notifications -->
        <NotificationDropdown userId="demo-user" />
        
        <!-- Keyboard Shortcuts -->
        <NDropdown trigger="click" :options="shortcutOptions" placement="bottom-end">
          <NButton text title="Keyboard Shortcuts">
            <template #icon>
              <NIcon :size="18"><Keyboard /></NIcon>
            </template>
          </NButton>
        </NDropdown>
        
        <!-- Theme Toggle -->
        <NButton text @click="toggleTheme()" title="Toggle Theme">
          <template #icon>
            <NIcon :size="18">
              <component :is="isDark ? Sun : Moon" />
            </NIcon>
          </template>
        </NButton>
        
        <!-- Divider -->
        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        
        <!-- Submit Button -->
        <NButton type="primary" size="small" @click="handleSave" :loading="isSaving">
          <template #icon>
            <NIcon><Save /></NIcon>
          </template>
          Submit & Next
        </NButton>
      </div>
    </slot>
  </div>
</template>
