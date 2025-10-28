<script setup lang="ts">
import type { ToolType, AnnotationType } from '~/types'
import { NModal, NForm, NFormItem, NInput, NRadioGroup, NRadioButton, NButton, NSpace, useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

const emit = defineEmits<{
  close: []
  created: [projectId: string]
}>()

const projectStore = useProjectStore()
const router = useRouter()

// Form state
const formData = ref({
  name: '',
  description: '',
  toolType: 'image' as ToolType,
  annotationType: 'bounding-box' as AnnotationType
})

const isCreating = ref(false)
const showModal = ref(false)
const message = useMessage()
const formRef = ref<FormInst | null>(null)

// Show modal after mount
onMounted(() => {
  showModal.value = true
})

// Form validation rules
const rules: FormRules = {
  name: [
    {
      required: true,
      message: 'Please enter a project name',
      trigger: ['input', 'blur']
    }
  ]
}

// Tool type options
const toolTypeOptions = [
  { value: 'image', label: 'Image' },
  { value: 'text', label: 'Text' },
  { value: 'sentiment', label: 'Sentiment' },
  { value: 'classification', label: 'Classification' },
  { value: 'rlhf', label: 'RLHF' },
  { value: 'emotion', label: 'Emotion' }
]

// Annotation type options based on tool type
const annotationTypeOptions = computed(() => {
  switch (formData.value.toolType) {
    case 'text':
      return [
        { value: 'ner', label: 'NER' },
        { value: 'classification', label: 'Classification' }
      ]
    case 'classification':
      return [
        { value: 'classification', label: 'Multi-label' }
      ]
    default:
      return []
  }
})

// Show annotation type selector
const showAnnotationType = computed(() => {
  return annotationTypeOptions.value.length > 1
})

// Auto-select annotation type when tool changes
watch(() => formData.value.toolType, (newToolType) => {
  switch (newToolType) {
    case 'image':
      formData.value.annotationType = 'bounding-box'
      break
    case 'text':
      formData.value.annotationType = 'ner'
      break
    case 'sentiment':
      formData.value.annotationType = 'sentiment'
      break
    case 'classification':
      formData.value.annotationType = 'classification'
      break
    case 'emotion':
      formData.value.annotationType = 'emotion'
      break
    case 'rlhf':
      formData.value.annotationType = 'ranking'
      break
  }
})

// Create project
async function createProject() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  isCreating.value = true
  try {
    // Create project via API (saves to database)
    const result = await projectStore.createProject({
      name: formData.value.name,
      description: formData.value.description,
      toolType: formData.value.toolType,
      annotationType: formData.value.annotationType
    })

    if (result.success && result.data) {
      message.success('Project created successfully')
      
      emit('created', result.data.id)
      handleClose()
      
      // Navigate to project detail
      router.push(`/projects/${result.data.id}`)
    } else {
      throw new Error('Failed to create project')
    }
  } catch (error) {
    console.error('Failed to create project:', error)
    message.error('Failed to create project')
  } finally {
    isCreating.value = false
  }
}

// Handle modal close
function handleClose() {
  showModal.value = false
  setTimeout(() => {
    emit('close')
  }, 200)
}

</script>

<template>
  <NModal
    v-model:show="showModal"
    preset="card"
    title="Create Project"
    size="small"
    :bordered="false"
    :segmented="{ content: 'soft', footer: 'soft' }"
    style="max-width: 480px"
    @after-leave="emit('close')"
  >
    <NForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="top"
      size="small"
      require-mark-placement="left"
    >
      <NFormItem label="Project Name" path="name">
        <NInput
          v-model:value="formData.name"
          placeholder="Street Signs Detection"
          @keydown.enter="createProject"
        />
      </NFormItem>

      <NFormItem label="Description">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          placeholder="Brief description..."
          :rows="2"
        />
      </NFormItem>

      <NFormItem label="Tool Type">
        <div class="grid grid-cols-3 gap-2">
          <NButton
            v-for="tool in toolTypeOptions"
            :key="tool.value"
            :type="formData.toolType === tool.value ? 'primary' : 'default'"
            size="small"
            @click="formData.toolType = tool.value as ToolType"
          >
            {{ tool.label }}
          </NButton>
        </div>
      </NFormItem>

      <NFormItem v-if="showAnnotationType" label="Annotation Type">
        <NSpace>
          <NButton
            v-for="option in annotationTypeOptions"
            :key="option.value"
            :type="formData.annotationType === option.value ? 'primary' : 'default'"
            size="small"
            @click="formData.annotationType = option.value as AnnotationType"
          >
            {{ option.label }}
          </NButton>
        </NSpace>
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton size="small" @click="handleClose">
          Cancel
        </NButton>
        <NButton
          type="primary"
          size="small"
          :loading="isCreating"
          @click="createProject"
        >
          Create
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
