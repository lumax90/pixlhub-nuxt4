<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { NCard, NButton, NIcon, NCheckbox, NRadioGroup, NRadio, NSpace, NEmpty } from 'naive-ui'
import type { Label, Project } from '~/types'

const props = defineProps<{
  project: Project
  taskId?: string
  readOnly?: boolean
}>()

const annotationStore = useAnnotationStore()
const route = useRoute()

// Determine mode from project annotation type
const currentMode = computed(() => {
  const annotationType = props.project.annotationType
  
  // Map annotation types to modes
  if (annotationType === 'ner') return 'ner'
  if (annotationType === 'sentiment') return 'sentiment'
  if (annotationType === 'classification') return 'classification'
  
  return 'ner' // default
})

// Text spans for NER
interface TextSpan {
  id: string
  start: number
  end: number
  text: string
  labelId: string
  color: string
}

const textSpans = ref<TextSpan[]>([])
const selectedSpanId = ref<string | null>(null)

// Sentiment annotation
const sentimentValue = ref<'positive' | 'negative' | 'neutral' | null>(null)

// Classification
const selectedClassifications = ref<string[]>([])

// Text content (loaded from API)
const textContent = ref('')
const isLoading = ref(false)

// Load text content from task
const loadTextContent = async () => {
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
      textContent.value = result.data.content
      console.log('✅ Text content loaded:', textContent.value.length, 'characters')
    } else {
      console.warn('⚠️ No text content found for task')
    }
  } catch (error) {
    console.error('❌ Failed to load text content:', error)
  } finally {
    isLoading.value = false
  }
}

// Load existing annotations (for review mode)
const loadExistingAnnotations = async () => {
  const taskId = props.taskId || route.query.task as string
  if (!taskId) return

  try {
    const response = await fetch(`/api/tasks/${taskId}`)
    const result = await response.json()

    if (result.success && result.data.annotations) {
      const annotations = result.data.annotations

      if (currentMode.value === 'ner') {
        // Load NER spans
        textSpans.value = annotations
          .filter((ann: any) => ann.type === 'text-span')
          .map((ann: any) => {
            const label = annotationStore.labels.find(l => l.id === ann.labelId)
            return {
              id: ann.id,
              start: ann.data.start,
              end: ann.data.end,
              text: ann.data.text,
              labelId: ann.labelId,
              color: label?.color || '#3B82F6'
            }
          })
        console.log('✅ Loaded', textSpans.value.length, 'NER annotations')
      } else if (currentMode.value === 'sentiment') {
        // Load sentiment
        const sentimentAnn = annotations.find((ann: any) => ann.type === 'sentiment')
        if (sentimentAnn) {
          sentimentValue.value = sentimentAnn.data.sentiment
          console.log('✅ Loaded sentiment:', sentimentValue.value)
        }
      } else if (currentMode.value === 'classification') {
        // Load classifications
        selectedClassifications.value = annotations
          .filter((ann: any) => ann.type === 'classification')
          .map((ann: any) => ann.labelId)
        console.log('✅ Loaded', selectedClassifications.value.length, 'classifications')
      }
    }
  } catch (error) {
    console.error('❌ Failed to load existing annotations:', error)
  }
}

// Text container ref
const textContainerRef = ref<HTMLDivElement | null>(null)

// Selection handling
function handleTextSelection() {
  if (props.readOnly) return // Disable in review mode
  if (currentMode.value !== 'ner') return
  if (!annotationStore.selectedLabelId) {
    console.warn('⚠️ Please select a label first')
    return
  }
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const selectedText = selection.toString().trim()
  
  if (!selectedText || selectedText.length === 0) return
  
  // Get start and end positions relative to the text
  const preSelectionRange = range.cloneRange()
  if (!textContainerRef.value) return
  
  preSelectionRange.selectNodeContents(textContainerRef.value)
  preSelectionRange.setEnd(range.startContainer, range.startOffset)
  const start = preSelectionRange.toString().length
  const end = start + selectedText.length
  
  // Check for overlaps
  const hasOverlap = textSpans.value.some(span => {
    return (start < span.end && end > span.start)
  })
  
  if (hasOverlap) {
    console.warn('⚠️ Cannot create overlapping spans')
    selection.removeAllRanges()
    return
  }
  
  // Get label color
  const label = annotationStore.labels.find(l => l.id === annotationStore.selectedLabelId)
  const color = label?.color || '#2563EB'
  
  // Create new span
  const newSpan: TextSpan = {
    id: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    start,
    end,
    text: selectedText,
    labelId: annotationStore.selectedLabelId,
    color
  }
  
  textSpans.value.push(newSpan)
  textSpans.value.sort((a, b) => a.start - b.start)
  
  console.log('✅ Text span created:', newSpan)
  
  // Clear selection
  selection.removeAllRanges()
}

// Delete span
function deleteSpan(spanId: string) {
  if (props.readOnly) return // Disable in review mode
  textSpans.value = textSpans.value.filter(s => s.id !== spanId)
  if (selectedSpanId.value === spanId) {
    selectedSpanId.value = null
  }
  console.log('🗑️ Span deleted:', spanId)
}

// Select span
function selectSpan(spanId: string) {
  selectedSpanId.value = selectedSpanId.value === spanId ? null : spanId
}

// Render text with highlights
const highlightedText = computed(() => {
  if (currentMode.value !== 'ner' || textSpans.value.length === 0) {
    return [{ text: textContent.value, isSpan: false }]
  }
  
  const parts: Array<{ text: string; isSpan: boolean; span?: TextSpan }> = []
  let lastIndex = 0
  
  textSpans.value.forEach(span => {
    // Add text before span
    if (span.start > lastIndex) {
      parts.push({
        text: textContent.value.substring(lastIndex, span.start),
        isSpan: false
      })
    }
    
    // Add span
    parts.push({
      text: span.text,
      isSpan: true,
      span
    })
    
    lastIndex = span.end
  })
  
  // Add remaining text
  if (lastIndex < textContent.value.length) {
    parts.push({
      text: textContent.value.substring(lastIndex),
      isSpan: false
    })
  }
  
  return parts
})

// Sentiment selection
function selectSentiment(value: 'positive' | 'negative' | 'neutral') {
  sentimentValue.value = sentimentValue.value === value ? null : value
  console.log('😊 Sentiment selected:', value)
}

// Classification toggle
function toggleClassification(labelId: string) {
  const index = selectedClassifications.value.indexOf(labelId)
  if (index > -1) {
    selectedClassifications.value.splice(index, 1)
  } else {
    selectedClassifications.value.push(labelId)
  }
  console.log('🏷️ Classifications:', selectedClassifications.value)
}

// Save annotations
async function saveAnnotations() {
  const taskId = props.taskId || route.query.task as string
  if (!taskId) {
    console.warn('⚠️ No task ID provided')
    return
  }

  try {
    let annotationsData: any = {}

    if (currentMode.value === 'ner') {
      // NER: Save text spans
      annotationsData = {
        taskId,
        annotations: textSpans.value,
        annotationType: 'ner'
      }
    } else if (currentMode.value === 'sentiment') {
      // Sentiment: Save sentiment value
      if (!sentimentValue.value) {
        console.warn('⚠️ No sentiment selected')
        return
      }
      annotationsData = {
        taskId,
        annotations: { sentiment: sentimentValue.value },
        annotationType: 'sentiment'
      }
    } else if (currentMode.value === 'classification') {
      // Classification: Save selected labels
      if (selectedClassifications.value.length === 0) {
        console.warn('⚠️ No classifications selected')
        return
      }
      annotationsData = {
        taskId,
        annotations: { labels: selectedClassifications.value },
        annotationType: 'classification'
      }
    }

    const response = await fetch('/api/annotations/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotationsData)
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Text annotations saved')
      // Success feedback handled by parent component
      return true
    } else {
      console.error('❌ Failed to save annotations')
      return false
    }
  } catch (error) {
    console.error('❌ Failed to save text annotations:', error)
    return false
  }
}

// Expose save function to parent
defineExpose({
  saveAnnotations
})

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  // Delete selected span
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSpanId.value) {
    e.preventDefault()
    deleteSpan(selectedSpanId.value)
  }
  
  // Note: Mode switching removed - mode is determined by project annotation type
}

onMounted(async () => {
  console.log('📝 Text Annotation Tool loaded')
  window.addEventListener('keydown', handleKeyDown)
  
  // Load text content
  await loadTextContent()
  
  // Always load existing annotations (both for editing and review)
  // Wait a bit for labels to be loaded in annotation store
  await new Promise(resolve => setTimeout(resolve, 100))
  await loadExistingAnnotations()
})

// Also watch for taskId changes to reload data
watch(() => props.taskId, async (newTaskId) => {
  if (newTaskId) {
    await loadTextContent()
    await loadExistingAnnotations()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ currentMode === 'ner' ? 'Named Entity Recognition' : currentMode === 'sentiment' ? 'Sentiment Analysis' : 'Text Classification' }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ project.name }}
          </p>
        </div>
        
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <span v-if="currentMode === 'ner'">{{ textSpans.length }} entities</span>
          <span v-if="currentMode === 'sentiment' && sentimentValue">Sentiment: {{ sentimentValue }}</span>
          <span v-if="currentMode === 'classification'">{{ selectedClassifications.length }} labels</span>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-8">
      <div class="max-w-4xl mx-auto">
        <!-- NER Mode -->
        <div v-if="currentMode === 'ner'" class="space-y-6">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div
              ref="textContainerRef"
              class="text-base leading-relaxed text-gray-800 dark:text-gray-200 select-text whitespace-pre-wrap"
              @mouseup="handleTextSelection"
            >
              <template v-for="(part, index) in highlightedText" :key="index">
                <span
                  v-if="!part.isSpan"
                  class=""
                >{{ part.text }}</span>
                <span
                  v-else
                  :style="{ backgroundColor: part.span?.color + '33', borderBottom: `2px solid ${part.span?.color}` }"
                  :class="[
                    'px-1 py-0.5 rounded cursor-pointer transition-all',
                    selectedSpanId === part.span?.id ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                  ]"
                  @click.stop="selectSpan(part.span!.id)"
                >{{ part.text }}</span>
              </template>
            </div>
          </div>
          
          <!-- Span List -->
          <div v-if="textSpans.length > 0">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Annotated Entities ({{ textSpans.length }})</h3>
            <NSpace vertical :size="8">
              <NCard
                v-for="span in textSpans"
                :key="span.id"
                size="small"
                :bordered="true"
                hoverable
                @click="selectSpan(span.id)"
                :class="selectedSpanId === span.id ? 'ring-2 ring-blue-500' : ''"
                style="cursor: pointer;"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: span.color }"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ span.text }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ annotationStore.labels.find(l => l.id === span.labelId)?.name || 'Unknown' }}
                    </p>
                  </div>
                  <NButton
                    v-if="!readOnly"
                    text
                    type="error"
                    size="small"
                    @click.stop="deleteSpan(span.id)"
                  >
                    <template #icon>
                      <NIcon><Trash2 /></NIcon>
                    </template>
                  </NButton>
                </div>
              </NCard>
            </NSpace>
          </div>
          
          <!-- Instructions -->
          <div class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            💡 Select text to create entity spans • Click spans to select • Press Delete to remove
          </div>
        </div>
        
        <!-- Sentiment Mode -->
        <div v-if="currentMode === 'sentiment'" class="space-y-6">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p v-if="isLoading" class="text-center text-gray-500">Loading...</p>
            <p v-else class="text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {{ textContent }}
            </p>
          </div>
          
          <!-- Sentiment Options -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Sentiment</h3>
            <NRadioGroup v-model:value="sentimentValue" size="large">
              <NSpace vertical :size="12">
                <NCard
                  v-for="sentiment in [{ value: 'positive', label: 'Positive', icon: '😊' }, { value: 'neutral', label: 'Neutral', icon: '😐' }, { value: 'negative', label: 'Negative', icon: '😞' }]"
                  :key="sentiment.value"
                  size="small"
                  :bordered="true"
                  hoverable
                  @click="selectSentiment(sentiment.value as any)"
                  :class="sentimentValue === sentiment.value ? 'ring-2 ring-blue-500' : ''"
                  style="cursor: pointer;"
                >
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{{ sentiment.icon }}</span>
                    <div class="flex-1">
                      <p class="text-sm font-semibold">{{ sentiment.label }}</p>
                    </div>
                    <NRadio :value="sentiment.value" />
                  </div>
                </NCard>
              </NSpace>
            </NRadioGroup>
          </div>
        </div>
        
        <!-- Classification Mode -->
        <div v-if="currentMode === 'classification'" class="space-y-6">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p v-if="isLoading" class="text-center text-gray-500">Loading...</p>
            <p v-else class="text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {{ textContent }}
            </p>
          </div>
          
          <!-- Classification Options -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Categories (Multi-select)</h3>
            <NSpace vertical :size="12">
              <NCard
                v-for="label in annotationStore.labels"
                :key="label.id"
                size="small"
                :bordered="true"
                hoverable
                @click="toggleClassification(label.id)"
                :class="selectedClassifications.includes(label.id) ? 'ring-2 ring-blue-500' : ''"
                style="cursor: pointer;"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-3 h-3 rounded flex-shrink-0"
                    :style="{ backgroundColor: label.color }"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-medium">{{ label.name }}</p>
                    <p v-if="label.description" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ label.description }}</p>
                  </div>
                  <NCheckbox :checked="selectedClassifications.includes(label.id)" />
                </div>
              </NCard>
            </NSpace>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
