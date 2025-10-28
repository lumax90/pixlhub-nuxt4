<script setup lang="ts">
import type { Project } from '~/types'
import { NCard, NButton, NSlider, NSpace, NGrid, NGridItem, useMessage } from 'naive-ui'

const props = defineProps<{
  project: Project
  taskId?: string
}>()

const annotationStore = useAnnotationStore()
const message = useMessage()
const route = useRoute()

// Emotion state
const selectedEmotion = ref<string | null>(null)
const intensity = ref<number>(3)
const textContent = ref('')
const isLoading = ref(false)

// Load content
const loadContent = async () => {
  const taskId = props.taskId || route.query.task as string
  if (!taskId) return

  isLoading.value = true
  try {
    const response = await fetch(`/api/tasks/${taskId}/content`)
    const result = await response.json()
    if (result.success && result.data.content) {
      textContent.value = result.data.content
    }
  } catch (error) {
    console.error('Failed to load content:', error)
  } finally {
    isLoading.value = false
  }
}

// Predefined emotions with emojis and colors
const emotions = [
  { id: 'joy', name: 'Joy', emoji: '😊', color: '#10B981', description: 'Happy, cheerful, delighted' },
  { id: 'sadness', name: 'Sadness', emoji: '😢', color: '#3B82F6', description: 'Sad, unhappy, sorrowful' },
  { id: 'anger', name: 'Anger', emoji: '😠', color: '#EF4444', description: 'Angry, frustrated, irritated' },
  { id: 'fear', name: 'Fear', emoji: '😨', color: '#8B5CF6', description: 'Scared, anxious, worried' },
  { id: 'surprise', name: 'Surprise', emoji: '😮', color: '#F59E0B', description: 'Surprised, shocked, amazed' },
  { id: 'disgust', name: 'Disgust', emoji: '🤢', color: '#84CC16', description: 'Disgusted, repulsed, revolted' },
  { id: 'love', name: 'Love', emoji: '❤️', color: '#EC4899', description: 'Loving, affectionate, caring' },
  { id: 'neutral', name: 'Neutral', emoji: '😐', color: '#6B7280', description: 'Neutral, indifferent, calm' }
]


// Select emotion
function selectEmotion(emotionId: string) {
  selectedEmotion.value = emotionId
  console.log('🎯 Selected emotion:', emotionId)
}

// Set intensity
function setIntensity(value: number) {
  intensity.value = value
  console.log('📊 Intensity:', value)
}

// Save emotion annotation
async function saveEmotion() {
  if (!selectedEmotion.value) {
    message.warning('Please select an emotion')
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
        annotations: { 
          emotion: selectedEmotion.value,
          intensity: intensity.value
        },
        annotationType: 'emotion'
      })
    })

    const result = await response.json()
    if (result.success) {
      const emotion = emotions.find(e => e.id === selectedEmotion.value)
      message.success(`Emotion saved: ${emotion?.name} (Intensity: ${intensity.value}/5)`)
      selectedEmotion.value = null
      intensity.value = 3
      return true
    }
  } catch (error) {
    console.error('Failed to save:', error)
    message.error('Failed to save emotion')
  }
  return false
}

defineExpose({ saveEmotion })

// Skip item
function skipItem() {
  console.log('⏭️ Skipping item')
  selectedEmotion.value = null
  intensity.value = 3
  // TODO: Load next item
}

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  // Number keys 1-8 for emotions
  if (e.key >= '1' && e.key <= '8') {
    const index = parseInt(e.key) - 1
    if (emotions[index]) {
      selectEmotion(emotions[index].id)
    }
  }
  
  // Enter to save
  if (e.key === 'Enter' && selectedEmotion.value) {
    saveEmotion()
  }
  
  // Space to skip
  if (e.key === ' ') {
    e.preventDefault()
    skipItem()
  }
}

onMounted(() => {
  console.log('😊 Emotion Tool loaded')
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
            Emotion Detection
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ project.name }}
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedEmotion ? emotions.find(e => e.id === selectedEmotion)?.name : 'No selection' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content - Split Screen -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Text Content -->
      <div class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-8">
        <div class="max-w-2xl">
          <p v-if="isLoading" class="text-center text-gray-500">Loading...</p>
          <p v-else class="text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {{ textContent }}
          </p>
        </div>
      </div>
      
      <!-- Right: Emotion Selection -->
      <div class="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
            Select Emotion
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Use keys 1-8
          </p>
        </div>
        
        <div class="flex-1 p-3 space-y-3 overflow-y-auto">
          <!-- Emotion Grid (2 columns) -->
          <NGrid :cols="2" :x-gap="6" :y-gap="6">
            <NGridItem v-for="(emotion, index) in emotions" :key="emotion.id">
              <NCard
                size="small"
                hoverable
                @click="selectEmotion(emotion.id)"
                :class="selectedEmotion === emotion.id ? 'ring-2 ring-blue-500' : ''"
                style="cursor: pointer;"
              >
                <div class="flex flex-col items-center gap-1 relative">
                  <div class="text-2xl">{{ emotion.emoji }}</div>
                  <div class="text-xs font-medium text-center">
                    {{ emotion.name }}
                  </div>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ index + 1 }}</span>
                  
                  <!-- Selected indicator -->
                  <div
                    v-if="selectedEmotion === emotion.id"
                    class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
                  >
                    <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </NCard>
            </NGridItem>
          </NGrid>
          
          <!-- Intensity Rating -->
          <NCard v-if="selectedEmotion" size="small" title="Intensity" :bordered="true">
            <NSpace vertical :size="12">
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Weak</span>
                <div class="flex-1">
                  <NSlider v-model:value="intensity" :min="1" :max="5" :step="1" />
                </div>
                <span>Strong</span>
              </div>
              
              <!-- Intensity Value -->
              <div class="flex items-center justify-center gap-1">
                <div
                  v-for="level in 5"
                  :key="level"
                  :class="[
                    'w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all',
                    level <= intensity
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  ]"
                >
                  {{ level }}
                </div>
              </div>
            </NSpace>
          </NCard>
        </div>
      </div>
    </div>
    
    <!-- Action Bar -->
    <div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <NButton text @click="skipItem">
          Skip (Space)
        </NButton>
        
        <NSpace>
          <NButton @click="selectedEmotion = null; intensity = 3">
            Clear
          </NButton>
          <NButton
            type="primary"
            @click="saveEmotion"
            :disabled="!selectedEmotion"
          >
            Save & Next (Enter)
          </NButton>
        </NSpace>
      </div>
    </div>
  </div>
</template>
