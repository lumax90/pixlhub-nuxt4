<script setup lang="ts">
import type { Project } from '~/types'
import { Check } from 'lucide-vue-next'
import { NCard, NButton, NSwitch, NIcon, NEmpty, NSpace, useMessage } from 'naive-ui'

const props = defineProps<{
  project: Project
  taskId?: string
}>()

const annotationStore = useAnnotationStore()
const message = useMessage()
const route = useRoute()

// Classification state
const selectedLabels = ref<string[]>([])
const isMultiLabel = ref(true)
const currentItem = ref<any>(null)
const isLoading = ref(false)

// Load content
const loadContent = async () => {
  const taskId = props.taskId || route.query.task as string
  if (!taskId) return

  isLoading.value = true
  try {
    const response = await fetch(`/api/tasks/${taskId}/content`)
    const result = await response.json()
    if (result.success) {
      currentItem.value = result.data
    }
  } catch (error) {
    console.error('Failed to load content:', error)
  } finally {
    isLoading.value = false
  }
}

// Toggle label selection
function toggleLabel(labelId: string) {
  if (isMultiLabel.value) {
    // Multi-label: toggle on/off
    const index = selectedLabels.value.indexOf(labelId)
    if (index > -1) {
      selectedLabels.value.splice(index, 1)
    } else {
      selectedLabels.value.push(labelId)
    }
  } else {
    // Single-label: replace selection
    selectedLabels.value = [labelId]
  }
  console.log('🏷️ Selected labels:', selectedLabels.value)
}

// Check if label is selected
function isSelected(labelId: string): boolean {
  return selectedLabels.value.includes(labelId)
}

// Save classification
async function saveClassification() {
  if (selectedLabels.value.length === 0) {
    message.warning('Please select at least one label')
    return
  }

  const taskId = props.taskId || route.query.task as string
  if (!taskId) return
  
  try {
    const response = await fetch('/api/annotations/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        annotations: { labels: selectedLabels.value },
        annotationType: 'classification'
      })
    })

    const result = await response.json()
    if (result.success) {
      message.success(`Classification saved: ${selectedLabels.value.length} label(s)`)
      return true
    }
  } catch (error) {
    console.error('Failed to save:', error)
    message.error('Failed to save classification')
  }
  return false
}

defineExpose({ saveClassification })

// Skip item
function skipItem() {
  console.log('⏭️ Skipping item')
  selectedLabels.value = []
  // TODO: Load next item
}

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  // Number keys 1-9 for quick label selection
  if (e.key >= '1' && e.key <= '9') {
    const index = parseInt(e.key) - 1
    const label = annotationStore.labels[index]
    if (label) {
      toggleLabel(label.id)
    }
  }
  
  // Enter to save
  if (e.key === 'Enter' && selectedLabels.value.length > 0) {
    saveClassification()
  }
  
  // Space to skip
  if (e.key === ' ') {
    e.preventDefault()
    skipItem()
  }
}

onMounted(() => {
  console.log('🏷️ Classification Tool loaded')
  window.addEventListener('keydown', handleKeyDown)
  loadContent()
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
            Classification
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ project.name }}
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Mode Toggle -->
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-600 dark:text-gray-400">Multi-label:</span>
            <NSwitch v-model:value="isMultiLabel" size="small" />
          </div>
          
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedLabels.length }} selected
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content - Two Column Layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Item Preview -->
      <div class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-8">
        <div class="max-w-full max-h-full flex items-center justify-center">
          <div v-if="currentItem.type === 'image'">
            <img
              :src="currentItem.url"
              :alt="currentItem.name"
              class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
          <div v-else class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ currentItem.name }}</p>
          </div>
        </div>
      </div>
      
      <!-- Right: Label Selection -->
      <div class="w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Select {{ isMultiLabel ? 'Categories' : 'Category' }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Use number keys (1-9) for quick selection
          </p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
          <!-- No labels state -->
          <div v-if="annotationStore.labels.length === 0">
            <NEmpty description="No labels defined" size="small">
              <template #extra>
                <NButton type="primary" size="small" @click="$router.push(`/projects/${project.id}`)">
                  Go to Project Settings
                </NButton>
              </template>
            </NEmpty>
          </div>
          
          <!-- Label List -->
          <NSpace v-else vertical :size="8">
            <NCard
              v-for="(label, index) in annotationStore.labels"
              :key="label.id"
              size="small"
              hoverable
              @click="toggleLabel(label.id)"
              :class="isSelected(label.id) ? 'ring-2 ring-blue-500' : ''"
              style="cursor: pointer;"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: label.color }"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium truncate">
                      {{ label.name }}
                    </p>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                      {{ index + 1 }}
                    </span>
                  </div>
                  <p v-if="label.description" class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {{ label.description }}
                  </p>
                </div>
                <NIcon v-if="isSelected(label.id)" :size="16" color="#3B82F6">
                  <Check />
                </NIcon>
              </div>
            </NCard>
          </NSpace>
        </div>
      </div>
    </div>
    
    <!-- Action Bar -->
    <div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <NButton text @click="skipItem">
          Skip (Space)
        </NButton>
        
        <NSpace>
          <NButton @click="selectedLabels = []">
            Clear
          </NButton>
          <NButton
            type="primary"
            @click="saveClassification"
            :disabled="selectedLabels.length === 0"
          >
            Save & Next (Enter)
          </NButton>
        </NSpace>
      </div>
    </div>
  </div>
</template>
