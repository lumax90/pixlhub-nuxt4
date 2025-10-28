<script setup lang="ts">
import type { Project } from '~/types'
import { ThumbsUp } from 'lucide-vue-next'
import { NCard, NButton, NRate, NInput, NIcon, NSpace, useMessage } from 'naive-ui'

const props = defineProps<{
  project: Project
  taskId?: string
}>()

const annotationStore = useAnnotationStore()
const message = useMessage()
const route = useRoute()

// RLHF state
const selectedResponse = ref<'A' | 'B' | null>(null)
const rating = ref<number>(0)
const feedback = ref('')

// RLHF data (loaded from API)
const currentTask = ref<any>(null)
const isLoading = ref(false)

// Load RLHF data from task
const loadRLHFData = async () => {
  const taskId = props.taskId || route.query.task as string
  if (!taskId) {
    console.warn('⚠️ No task ID provided')
    return
  }

  isLoading.value = true
  try {
    const response = await fetch(`/api/tasks/${taskId}/content`)
    const result = await response.json()

    if (result.success && result.data.content) {
      // Parse JSON content
      const rlhfData = JSON.parse(result.data.content)
      currentTask.value = {
        id: taskId,
        prompt: rlhfData.prompt || '',
        responseA: {
          id: 'resp_a',
          text: rlhfData.responseA || rlhfData.response_a || ''
        },
        responseB: {
          id: 'resp_b',
          text: rlhfData.responseB || rlhfData.response_b || ''
        }
      }
      console.log('✅ RLHF data loaded:', currentTask.value)
    } else {
      console.warn('⚠️ No RLHF content found for task')
    }
  } catch (error) {
    console.error('❌ Failed to load RLHF data:', error)
    message.error('Failed to load RLHF data')
  } finally {
    isLoading.value = false
  }
}

// Select preferred response
function selectResponse(choice: 'A' | 'B') {
  selectedResponse.value = choice
  console.log('🎯 Selected response:', choice)
}

// Set rating (1-5 stars)
function setRating(stars: number) {
  rating.value = stars
  console.log('⭐ Rating:', stars)
}

// Save ranking
async function saveRanking() {
  if (!selectedResponse.value) {
    message.warning('Please select a preferred response')
    return
  }

  if (!currentTask.value) {
    message.error('No task loaded')
    return
  }
  
  try {
    const response = await fetch('/api/annotations/rlhf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: currentTask.value.id,
        preferred: selectedResponse.value,
        rating: rating.value,
        feedback: feedback.value,
        responseA: currentTask.value.responseA.text,
        responseB: currentTask.value.responseB.text
      })
    })

    const result = await response.json()

    if (result.success) {
      message.success(`Ranking saved: Response ${selectedResponse.value} preferred`)
      console.log('✅ RLHF ranking saved')
      
      // Reset for next task
      selectedResponse.value = null
      rating.value = 0
      feedback.value = ''
    } else {
      message.error('Failed to save ranking')
    }
  } catch (error) {
    console.error('❌ Failed to save RLHF ranking:', error)
    message.error('Failed to save ranking')
  }
}

// Skip task
function skipTask() {
  console.log('⏭️ Skipping task')
  selectedResponse.value = null
  rating.value = 0
  feedback.value = ''
  // TODO: Load next task
}

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  // A key for response A
  if (e.key === 'a' || e.key === 'A') {
    selectResponse('A')
  }
  // B key for response B
  if (e.key === 'b' || e.key === 'B') {
    selectResponse('B')
  }
  // Number keys for rating
  if (e.key >= '1' && e.key <= '5') {
    setRating(parseInt(e.key))
  }
  // Enter to save
  if (e.key === 'Enter' && selectedResponse.value) {
    saveRanking()
  }
}

onMounted(() => {
  console.log('🤖 RLHF Tool loaded')
  window.addEventListener('keydown', handleKeyDown)
  
  // Load RLHF data
  loadRLHFData()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="w-full h-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            RLHF - Response Ranking
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ project.name }}
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedResponse ? `Response ${selectedResponse} selected` : 'No selection' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <p class="text-gray-500">Loading RLHF data...</p>
      </div>

      <!-- No Data State -->
      <div v-else-if="!currentTask" class="flex items-center justify-center h-full">
        <p class="text-gray-500">No RLHF data available</p>
      </div>

      <!-- Content -->
      <div v-else class="max-w-6xl mx-auto space-y-6">
        <!-- Prompt -->
        <NCard size="small" title="Prompt" :bordered="true" class="bg-blue-50 dark:bg-blue-900/20">
          <p class="text-sm text-gray-800 dark:text-gray-200">
            {{ currentTask.prompt }}
          </p>
        </NCard>
        
        <!-- Response Comparison -->
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Response A -->
          <NCard
            size="small"
            hoverable
            @click="selectResponse('A')"
            :class="selectedResponse === 'A' ? 'ring-2 ring-green-500' : ''"
            style="cursor: pointer;"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    selectedResponse === 'A'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  ]">
                    A
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Press 'A'</span>
                </div>
                <NIcon v-if="selectedResponse === 'A'" :size="18" color="#10B981">
                  <ThumbsUp />
                </NIcon>
              </div>
            </template>
            <div class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {{ currentTask.responseA.text }}
            </div>
          </NCard>
          
          <!-- Response B -->
          <NCard
            size="small"
            hoverable
            @click="selectResponse('B')"
            :class="selectedResponse === 'B' ? 'ring-2 ring-green-500' : ''"
            style="cursor: pointer;"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div :class="[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    selectedResponse === 'B'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  ]">
                    B
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Press 'B'</span>
                </div>
                <NIcon v-if="selectedResponse === 'B'" :size="18" color="#10B981">
                  <ThumbsUp />
                </NIcon>
              </div>
            </template>
            <div class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {{ currentTask.responseB.text }}
            </div>
          </NCard>
        </div>
        
        <!-- Rating (Optional) -->
        <NCard size="small" title="Rate Quality (Optional)" :bordered="true">
          <NRate v-model:value="rating" size="large" />
        </NCard>
        
        <!-- Feedback (Optional) -->
        <NCard size="small" title="Additional Feedback (Optional)" :bordered="true">
          <NInput
            v-model:value="feedback"
            type="textarea"
            :rows="3"
            placeholder="Why did you prefer this response? Any issues or suggestions?"
            size="small"
          />
        </NCard>
      </div>
    </div>
    
    <!-- Action Bar -->
    <div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <NButton text @click="skipTask">
          Skip Task
        </NButton>
        
        <NSpace>
          <NButton @click="selectedResponse = null; rating = 0; feedback = ''">
            Clear
          </NButton>
          <NButton
            type="primary"
            @click="saveRanking"
            :disabled="!selectedResponse"
          >
            Save & Next (Enter)
          </NButton>
        </NSpace>
      </div>
    </div>
  </div>
</template>
