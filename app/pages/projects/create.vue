<script setup lang="ts">
import type { Project, ToolType } from '~/types'
import { ArrowLeft, Check, Image, FileText, Tag, Bot, Heart, Video, Mic, FileImage } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const projectStore = useProjectStore()

// Form state
const formData = ref({
  name: '',
  description: '',
  toolType: 'image' as ToolType,
  annotationType: 'bounding-box' as any
})

const isCreating = ref(false)

// Tool type options with Lucide icons
const toolTypes = [
  { id: 'image', name: 'Image', description: 'Bbox, polygon, segmentation', icon: Image },
  { id: 'text', name: 'Text', description: 'NER, entity extraction', icon: FileText },
  { id: 'sentiment', name: 'Sentiment', description: 'Positive/Negative/Neutral', icon: Heart },
  { id: 'classification', name: 'Classification', description: 'Single/multi-label categories', icon: Tag },
  { id: 'rlhf', name: 'RLHF', description: 'Ranking & preference', icon: Bot },
  { id: 'emotion', name: 'Emotion', description: 'Emotion detection', icon: Heart },
  { id: 'video', name: 'Video', description: 'Frame-by-frame', icon: Video },
  { id: 'audio', name: 'Audio', description: 'Transcription', icon: Mic },
  { id: 'document', name: 'Document', description: 'OCR & layout', icon: FileImage }
]

// Annotation type options based on tool type
const annotationTypeOptions = computed(() => {
  switch (formData.value.toolType) {
    case 'image':
      return [
        { value: 'bounding-box', label: 'Bounding Box' },
        { value: 'polygon', label: 'Polygon' },
        { value: 'segmentation', label: 'Segmentation' },
        { value: 'keypoint', label: 'Keypoint' },
        { value: 'point', label: 'Point' }
      ]
    case 'text':
      return [
        { value: 'ner', label: 'Named Entity Recognition' },
        { value: 'classification', label: 'Text Classification' }
      ]
    case 'sentiment':
      return [{ value: 'sentiment', label: 'Sentiment Analysis' }]
    case 'classification':
      return [{ value: 'classification', label: 'Multi-label Classification' }]
    default:
      return [{ value: 'classification', label: 'Classification' }]
  }
})

// Auto-select first annotation type when tool type changes
watch(() => formData.value.toolType, () => {
  const firstOption = annotationTypeOptions.value[0]
  if (firstOption) {
    formData.value.annotationType = firstOption.value
  }
})

// Validation
const isValid = computed(() => {
  return formData.value.name.trim().length > 0 &&
         formData.value.description.trim().length > 0 &&
         formData.value.toolType
})

// Create project
async function createProject() {
  if (!isValid.value) return
  
  isCreating.value = true
  
  try {
    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: 'org_acme_corp',
      name: formData.value.name,
      description: formData.value.description,
      status: 'active',
      toolType: formData.value.toolType,
      annotationType: formData.value.annotationType,
      totalAssets: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdBy: 'user_admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Add to store
    projectStore.projects.push(newProject)
    
    console.log('✅ Project created:', newProject)
    
    // Redirect to project detail page for configuration
    router.push(`/projects/${newProject.id}`)
  } catch (error) {
    console.error('Failed to create project:', error)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 py-3">
        <button
          @click="router.push('/projects')"
          class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft :size="14" />
          Back
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="mb-5">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Create Project
        </h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Configure your annotation project
        </p>
      </div>
      
      <div class="space-y-4">
        <!-- Basic Information -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Basic Information
          </h2>
          
          <div class="space-y-3">
            <!-- Project Name -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Project Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="e.g., Street Signs Detection"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="formData.description"
                rows="2"
                placeholder="Describe the purpose of this project"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>
          </div>
        </div>
        
        <!-- Tool Type Selection -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Tool Type <span class="text-red-500">*</span>
          </h2>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              v-for="tool in toolTypes"
              :key="tool.id"
              @click="formData.toolType = tool.id as ToolType"
              :class="[
                'relative p-3 rounded-lg border transition-all text-left',
                formData.toolType === tool.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              ]"
            >
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <component :is="tool.icon" :size="16" class="text-gray-700 dark:text-gray-300" />
                  <Check v-if="formData.toolType === tool.id" :size="14" class="text-blue-500" />
                </div>
                <div>
                  <h3 class="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {{ tool.name }}
                  </h3>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ tool.description }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <!-- Annotation Type -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Annotation Type
          </h2>
          
          <div class="space-y-1.5">
            <label
              v-for="option in annotationTypeOptions"
              :key="option.value"
              class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <input
                v-model="formData.annotationType"
                type="radio"
                :value="option.value"
                class="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-gray-900 dark:text-gray-100">
                {{ option.label }}
              </span>
            </label>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="router.push('/projects')"
            class="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          
          <button
            @click="createProject"
            :disabled="!isValid || isCreating"
            :class="[
              'px-4 py-2 rounded-lg text-xs font-medium transition-all',
              isValid && !isCreating
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            ]"
          >
            {{ isCreating ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
