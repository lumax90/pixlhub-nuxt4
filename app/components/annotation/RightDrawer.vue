<script setup lang="ts">
import { MessageSquare, FileText, Database, Info, ChevronRight, Check, X, Clock } from 'lucide-vue-next'
import { NButton, NIcon, NCard, NEmpty, NText, NSpace, NBadge, NDivider } from 'naive-ui'

type TabType = 'comments' | 'guidelines' | 'dataset' | 'information'

const commentStore = useCommentStore()
const projectStore = useProjectStore()
const route = useRoute()
const router = useRouter()
const activeTab = ref<TabType | null>(null)

// Get current project
const projectId = computed(() => route.query.project as string)
const currentTaskId = computed(() => route.query.task as string)

// Timer - only for active tasks (not completed/review)
const timer = computed(() => {
  if (!currentTaskId.value) return null
  if (!currentTaskDetails.value) return null
  
  // Don't start timer for completed or review tasks
  const status = currentTaskDetails.value.status
  if (status === 'completed' || status === 'review') return null
  
  return useTaskTimer(currentTaskId.value)
})

// Format time helper
const formatTaskTime = (seconds: number) => {
  if (seconds === 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}

const currentProject = computed(() => {
  return projectStore.projects.find(p => p.id === projectId.value) || null
})

// Fetch current task details
const currentTaskDetails = ref<any>(null)
const isLoadingTaskDetails = ref(false)

const loadTaskDetails = async () => {
  if (!currentTaskId.value) return
  
  isLoadingTaskDetails.value = true
  try {
    const response = await fetch(`/api/tasks/${currentTaskId.value}`)
    const result = await response.json()
    
    if (result.success) {
      currentTaskDetails.value = result.data
    }
  } catch (error) {
    console.error('Failed to load task details:', error)
  } finally {
    isLoadingTaskDetails.value = false
  }
}

// Load task details when information tab is opened
watch(activeTab, (tab) => {
  if (tab === 'information') {
    loadTaskDetails()
  }
})

// Also reload when task changes
watch(currentTaskId, () => {
  if (activeTab.value === 'information') {
    loadTaskDetails()
  }
})

// Fetch label queue tasks
const labelQueueTasks = ref<any[]>([])
const isLoadingTasks = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return labelQueueTasks.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(labelQueueTasks.value.length / pageSize.value)
})

const loadLabelQueue = async () => {
  if (!projectId.value) return
  
  isLoadingTasks.value = true
  try {
    const response = await fetch(`/api/tasks/label-queue?projectId=${projectId.value}`)
    const result = await response.json()
    
    if (result.success) {
      labelQueueTasks.value = result.data
    }
  } catch (error) {
    console.error('Failed to load label queue:', error)
  } finally {
    isLoadingTasks.value = false
  }
}

// Load tasks when dataset tab is opened
watch(activeTab, (tab) => {
  if (tab === 'dataset') {
    loadLabelQueue()
  }
})

const navigateToTask = (taskId: string) => {
  router.push(`/annotate?project=${projectId.value}&task=${taskId}`)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'label':
      return 'text-blue-600 dark:text-blue-400'
    case 'review':
      return 'text-amber-600 dark:text-amber-400'
    case 'completed':
      return 'text-green-600 dark:text-green-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

// Resizable drawer
const drawerWidth = ref(264) // Default 264px
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = drawerWidth.value
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  const diff = startX.value - e.clientX
  const newWidth = Math.max(200, Math.min(600, startWidth.value + diff))
  drawerWidth.value = newWidth
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Helper function to format bytes
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Watch comments
watch(() => commentStore.taskComments, () => {
  // Comments updated
}, { deep: true, immediate: true })

const tabs = [
  { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
  { id: 'guidelines' as const, label: 'Guidelines', icon: FileText },
  { id: 'dataset' as const, label: 'Dataset', icon: Database },
  { id: 'information' as const, label: 'Information', icon: Info }
]

const toggleTab = (tabId: TabType) => {
  activeTab.value = activeTab.value === tabId ? null : tabId
}

const closeDrawer = () => {
  activeTab.value = null
}
</script>

<template>
  <div class="relative h-full">
    <!-- Resize Handle -->
    <div
      v-if="activeTab"
      class="absolute top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-blue-500 cursor-col-resize z-20 transition-all"
      :style="{ right: `${drawerWidth + 32}px` }"
      @mousedown="startResize"
    />
    
    <!-- Expanded Panel (Overlay) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 translate-x-full"
      enter-to-class="opacity-100 translate-x-0"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-full"
    >
      <div
        v-if="activeTab"
        class="absolute top-0 bottom-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-lg z-10"
        :style="{ right: '32px', width: `${drawerWidth}px` }"
      >
        <!-- Panel Header -->
        <div class="h-12 px-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {{ activeTab }}
          </h3>
          <NButton text size="tiny" @click="closeDrawer">
            <template #icon>
              <NIcon :size="14">
                <ChevronRight />
              </NIcon>
            </template>
          </NButton>
        </div>

        <!-- Panel Content -->
        <div class="flex-1 overflow-y-auto p-3">
          <!-- Comments Content -->
          <div v-if="activeTab === 'comments'">
            <div v-if="commentStore.taskComments.length === 0">
              <NEmpty description="No comments yet" size="small">
                <template #extra>
                  <NText depth="3" class="text-xs">
                    Use the comment tool to add questions or notes
                  </NText>
                </template>
              </NEmpty>
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="comment in commentStore.taskComments"
                :key="comment.id"
                class="p-3 rounded-lg border transition-all cursor-pointer"
                :class="[
                  commentStore.activeCommentId === comment.id
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
                @click="commentStore.setActiveComment(comment.id)"
              >
                <!-- Comment Header -->
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="comment.resolved ? 'bg-green-500' : 'bg-amber-500'"
                    />
                    <NText class="text-xs font-medium">{{ comment.author }}</NText>
                  </div>
                  <NSpace :size="4">
                    <NButton
                      text
                      size="tiny"
                      @click.stop="commentStore.toggleResolved(comment.id)"
                      :title="comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'"
                    >
                      <template #icon>
                        <NIcon :size="14" :color="comment.resolved ? '#10B981' : '#9CA3AF'">
                          <Check />
                        </NIcon>
                      </template>
                    </NButton>
                    <NButton
                      text
                      size="tiny"
                      @click.stop="commentStore.deleteComment(comment.id)"
                      title="Delete comment"
                    >
                      <template #icon>
                        <NIcon :size="14" color="#EF4444">
                          <X />
                        </NIcon>
                      </template>
                    </NButton>
                  </NSpace>
                </div>
                
                <!-- Comment Message -->
                <NText class="text-xs text-gray-700 dark:text-gray-300 block mb-2">
                  {{ comment.message }}
                </NText>
                
                <!-- Comment Time -->
                <NText depth="3" class="text-[10px]">
                  {{ new Date(comment.createdAt).toLocaleString() }}
                </NText>
              </div>
            </div>
          </div>

          <!-- Guidelines Content -->
          <div v-if="activeTab === 'guidelines'">
            <div v-if="(currentProject as any)?.metadata?.guidelinesPdfUrl" class="h-full">
              <iframe
                :src="(currentProject as any).metadata.guidelinesPdfUrl"
                class="w-full h-[calc(100vh-120px)] border-0 rounded"
                title="Annotation Guidelines"
              />
            </div>
            <div v-else-if="(currentProject as any)?.metadata?.guidelines" class="p-3">
              <NText class="text-xs whitespace-pre-wrap">
                {{ (currentProject as any).metadata.guidelines }}
              </NText>
            </div>
            <NEmpty v-else description="No guidelines available" size="small">
              <template #extra>
                <NText depth="3" class="text-xs">
                  Guidelines can be added in project settings
                </NText>
              </template>
            </NEmpty>
          </div>

          <!-- Dataset Content -->
          <div v-if="activeTab === 'dataset'" class="flex flex-col h-full">
            <div v-if="isLoadingTasks" class="p-4 text-center">
              <NText depth="3" class="text-xs">Loading tasks...</NText>
            </div>
            
            <div v-else-if="labelQueueTasks.length === 0" class="p-3">
              <NEmpty description="No tasks in queue" size="small" />
            </div>
            
            <div v-else class="flex-1 overflow-y-auto">
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <div
                  v-for="task in paginatedTasks"
                  :key="task.id"
                  class="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  :class="[
                    task.id === currentTaskId ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  ]"
                >
                  <!-- Thumbnail -->
                  <div class="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    <img
                      v-if="task.asset?.metadata?.thumbnailUrl || task.asset?.url"
                      :src="task.asset?.metadata?.thumbnailUrl || task.asset?.url"
                      :alt="task.asset?.name"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  <!-- Info -->
                  <div class="flex-1 min-w-0 pt-1">
                    <NText class="text-xs font-medium block truncate mb-2">
                      {{ task.asset?.name || 'Untitled' }}
                    </NText>
                    
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <NText depth="3" class="text-[10px]">Assignee</NText>
                        <NText class="text-[10px]">
                          {{ task.assignedTo || '-' }}
                        </NText>
                      </div>
                      
                      <div class="flex items-center justify-between">
                        <NText depth="3" class="text-[10px]">Stage Status</NText>
                        <NText class="text-[10px]" :class="getStatusColor(task.status)">
                          {{ task.status }}
                        </NText>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Pagination -->
              <div v-if="totalPages > 1" class="p-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <NText depth="3" class="text-[10px]">
                    {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, labelQueueTasks.length) }} of {{ labelQueueTasks.length }}
                  </NText>
                  <NSpace :size="4">
                    <NButton
                      text
                      size="tiny"
                      :disabled="currentPage === 1"
                      @click="currentPage--"
                    >
                      Prev
                    </NButton>
                    <NButton
                      text
                      size="tiny"
                      :disabled="currentPage === totalPages"
                      @click="currentPage++"
                    >
                      Next
                    </NButton>
                  </NSpace>
                </div>
              </div>
            </div>
          </div>

          <!-- Information Content -->
          <div v-if="activeTab === 'information'">
            <div v-if="isLoadingTaskDetails" class="p-4 text-center">
              <NText depth="3" class="text-xs">Loading...</NText>
            </div>
            
            <div v-else-if="!currentTaskDetails" class="p-3">
              <NEmpty description="No task information" size="small" />
            </div>
            
            <div v-else class="p-3 space-y-4">
              <!-- Timer Display -->
              <div v-if="timer" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <Clock :size="14" :class="timer.isActive.value ? 'text-blue-500' : 'text-gray-400'" />
                    <NText class="text-xs font-semibold">Active Time</NText>
                  </div>
                  <span v-if="!timer.isActive.value" class="text-[10px] text-gray-400">(idle)</span>
                </div>
                <div class="font-mono text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {{ timer.formatTime(timer.displayTime.value) }}
                </div>
                <NText depth="3" class="text-[10px] mt-1 block">
                  Time actively spent on this task
                </NText>
              </div>

              <!-- Task Information -->
              <div>
                <NText class="text-xs font-semibold block mb-2">Task Information</NText>
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Task ID</NText>
                    <NText class="text-[10px] font-mono">{{ currentTaskDetails.id }}</NText>
                  </div>
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Status</NText>
                    <NText class="text-[10px]" :class="getStatusColor(currentTaskDetails.status)">
                      {{ currentTaskDetails.status }}
                    </NText>
                  </div>
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Priority</NText>
                    <NText class="text-[10px]">{{ currentTaskDetails.priority || 'Normal' }}</NText>
                  </div>
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Created At</NText>
                    <NText class="text-[10px]">{{ new Date(currentTaskDetails.createdAt).toLocaleString() }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentTaskDetails.updatedAt">
                    <NText depth="3" class="text-[10px]">Updated At</NText>
                    <NText class="text-[10px]">{{ new Date(currentTaskDetails.updatedAt).toLocaleString() }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentTaskDetails.assignedTo">
                    <NText depth="3" class="text-[10px]">Assigned To</NText>
                    <NText class="text-[10px]">{{ currentTaskDetails.assignedTo }}</NText>
                  </div>
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Total Time Spent</NText>
                    <NText class="text-[10px] font-medium">{{ formatTaskTime(currentTaskDetails.timeSpent || 0) }}</NText>
                  </div>
                </div>
              </div>

              <NDivider style="margin: 12px 0" />

              <!-- Asset Information -->
              <div v-if="currentTaskDetails.asset">
                <NText class="text-xs font-semibold block mb-2">Asset Information</NText>
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Asset ID</NText>
                    <NText class="text-[10px] font-mono">{{ currentTaskDetails.asset.id }}</NText>
                  </div>
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Name</NText>
                    <NText class="text-[10px]">{{ currentTaskDetails.asset.name }}</NText>
                  </div>
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Type</NText>
                    <NText class="text-[10px]">{{ currentTaskDetails.asset.type }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentTaskDetails.asset.metadata?.size">
                    <NText depth="3" class="text-[10px]">Size</NText>
                    <NText class="text-[10px]">{{ formatBytes(currentTaskDetails.asset.metadata.size) }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentTaskDetails.asset.metadata?.width">
                    <NText depth="3" class="text-[10px]">Dimensions</NText>
                    <NText class="text-[10px]">{{ currentTaskDetails.asset.metadata.width }} × {{ currentTaskDetails.asset.metadata.height }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentTaskDetails.asset.metadata?.batchName">
                    <NText depth="3" class="text-[10px]">Batch</NText>
                    <NText class="text-[10px]">{{ currentTaskDetails.asset.metadata.batchName }}</NText>
                  </div>
                </div>
              </div>

              <NDivider style="margin: 12px 0" />

              <!-- Project Information -->
              <div>
                <NText class="text-xs font-semibold block mb-2">Project Information</NText>
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <NText depth="3" class="text-[10px]">Project ID</NText>
                    <NText class="text-[10px] font-mono">{{ currentTaskDetails.projectId }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentProject">
                    <NText depth="3" class="text-[10px]">Project Name</NText>
                    <NText class="text-[10px]">{{ currentProject.name }}</NText>
                  </div>
                  <div class="flex justify-between items-start" v-if="currentProject">
                    <NText depth="3" class="text-[10px]">Tool Type</NText>
                    <NText class="text-[10px]">{{ currentProject.toolType }}</NText>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Tab Bar -->
    <div class="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full" style="width: 32px;">
      <NButton
        v-for="tab in tabs"
        :key="tab.id"
        text
        @click="toggleTab(tab.id)"
        :type="activeTab === tab.id ? 'primary' : 'default'"
        :class="[
          'flex-1 flex items-center justify-center py-3 relative rounded-none',
          activeTab === tab.id ? '!bg-blue-50 dark:!bg-blue-900/20' : ''
        ]"
        :title="tab.label"
        style="height: auto; min-height: 0;"
      >
        <!-- Active Indicator -->
        <div
          v-if="activeTab === tab.id"
          class="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
        />
        
        <!-- Icon and Text in same row -->
        <div class="writing-mode-vertical flex items-center gap-1">
          <NBadge
            v-if="tab.id === 'comments' && commentStore.unresolvedComments.length > 0"
            :value="commentStore.unresolvedComments.length"
            :max="9"
            :offset="[-2, 2]"
          >
            <NIcon :size="14">
              <component :is="tab.icon" />
            </NIcon>
          </NBadge>
          <NIcon v-else :size="14">
            <component :is="tab.icon" />
          </NIcon>
          <span class="text-[9px] font-medium tracking-wide">
            {{ tab.label }}
          </span>
        </div>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
</style>
