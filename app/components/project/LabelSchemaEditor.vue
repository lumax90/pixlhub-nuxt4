<script setup lang="ts">
import { Plus, Trash2, GripVertical, Save, Settings, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { NCard, NButton, NInput, NInputNumber, NColorPicker, NCollapse, NCollapseItem, NForm, NFormItem, NSelect, NSwitch, NSpace, NIcon, NModal, useMessage, useDialog } from 'naive-ui'
import draggable from 'vuedraggable'
import type { LabelClass, LabelAttribute, AttributeOption } from '~/types'

const props = defineProps<{
  projectId: string
  toolType?: string
}>()

const message = useMessage()
const dialog = useDialog()

// State
const labelSchema = ref<any>(null)
const labelClasses = ref<LabelClass[]>([])
const expandedLabels = ref<string[]>([])
const hasChanges = ref(false)
const isSaving = ref(false)
const isLoading = ref(true)

// Input type options
const inputTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Select', value: 'select' },
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' }
]

// Tool-specific help text
const toolTypeInfo = computed(() => {
  switch (props.toolType) {
    case 'image':
      return 'Define labels for image annotations (bounding boxes, polygons, etc.)'
    case 'text':
      return 'Define entity types for text annotation (NER, entity extraction)'
    case 'sentiment':
      return 'Sentiment labels are predefined (Positive, Negative, Neutral)'
    case 'classification':
      return 'Define categories for single or multi-label classification'
    default:
      return 'Define labels for your annotation project'
  }
})

// Generate random color
const generateRandomColor = (): string => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  return colors[Math.floor(Math.random() * colors.length)]!
}

// Toggle label expansion
const toggleExpand = (labelId: string) => {
  const index = expandedLabels.value.indexOf(labelId)
  if (index > -1) {
    expandedLabels.value.splice(index, 1)
  } else {
    expandedLabels.value.push(labelId)
  }
}

// Initialize with mock data
onMounted(() => {
  loadLabelSchema()
})

const loadLabelSchema = async () => {
  isLoading.value = true
  try {
    // Pass toolType as query param to get appropriate default schema
    const url = props.toolType 
      ? `/api/projects/labels/${props.projectId}?toolType=${props.toolType}`
      : `/api/projects/labels/${props.projectId}`
    
    const response = await $fetch<{ success: boolean; data: any }>(url)
    if (response.success && response.data) {
      labelSchema.value = response.data
      labelClasses.value = response.data.classes || []
      hasChanges.value = false // Reset changes after load
    }
  } catch (error) {
    console.error('Failed to load label schema:', error)
    // Initialize with empty array on error
    labelClasses.value = []
  } finally {
    isLoading.value = false
  }
}

// Add new label
const addLabel = () => {
  const newOrder = labelClasses.value.length
  const newLabel = {
    id: `label_${Date.now()}`,
    labelSchemaId: 'schema_1',
    name: `Label ${newOrder + 1}`,
    color: generateRandomColor(),
    shortcut: newOrder < 9 ? String(newOrder + 1) : undefined,
    description: '',
    order: newOrder,
    attributes: [],
    annotationTypes: ['bounding-box', 'polygon'],
    createdAt: new Date(),
    updatedAt: new Date()
  } as LabelClass
  labelClasses.value.push(newLabel)
  hasChanges.value = true
}

// Remove label
const removeLabel = (id: string) => {
  labelClasses.value = labelClasses.value.filter(label => label.id !== id)
  updateLabelOrder()
  hasChanges.value = true
}

// Update label order after drag/drop (keep shortcuts as-is)
const updateLabelOrder = () => {
  labelClasses.value.forEach((label, index) => {
    label.order = index
    // Don't auto-update shortcuts - user can set them manually
  })
  hasChanges.value = true
}

// Handle drag end
const onDragEnd = () => {
  updateLabelOrder()
}

// Update label field
const updateLabel = (id: string, field: keyof LabelClass, value: any) => {
  const label = labelClasses.value.find(l => l.id === id)
  if (label) {
    (label as any)[field] = value
    label.updatedAt = new Date()
    hasChanges.value = true
  }
}

// Add attribute to label
const addAttribute = (labelId: string) => {
  const label = labelClasses.value.find(l => l.id === labelId)
  if (label) {
    const newAttr: LabelAttribute = {
      id: `attr_${Date.now()}`,
      name: 'New Attribute',
      inputType: 'text',
      required: false
    }
    label.attributes.push(newAttr)
    hasChanges.value = true
  }
}

// Remove attribute
const removeAttribute = (labelId: string, attrId: string) => {
  const label = labelClasses.value.find(l => l.id === labelId)
  if (label) {
    label.attributes = label.attributes.filter(a => a.id !== attrId)
    hasChanges.value = true
  }
}

// Update attribute
const updateAttribute = (labelId: string, attrId: string, field: keyof LabelAttribute, value: any) => {
  const label = labelClasses.value.find(l => l.id === labelId)
  if (label) {
    const attr = label.attributes.find(a => a.id === attrId)
    if (attr) {
      (attr as any)[field] = value
      hasChanges.value = true
    }
  }
}

// Add option to attribute
const addOption = (labelId: string, attrId: string) => {
  const label = labelClasses.value.find(l => l.id === labelId)
  if (label) {
    const attr = label.attributes.find(a => a.id === attrId)
    if (attr) {
      if (!attr.options) attr.options = []
      attr.options.push({
        id: `opt_${Date.now()}`,
        value: `Option ${attr.options.length + 1}`
      })
      hasChanges.value = true
    }
  }
}

// Remove option from attribute
const removeOption = (labelId: string, attrId: string, optionId: string) => {
  const label = labelClasses.value.find(l => l.id === labelId)
  if (label) {
    const attr = label.attributes.find(a => a.id === attrId)
    if (attr && attr.options) {
      attr.options = attr.options.filter(o => o.id !== optionId)
      hasChanges.value = true
    }
  }
}

// Update option value
const updateOption = (labelId: string, attrId: string, optionId: string, value: string) => {
  const label = labelClasses.value.find(l => l.id === labelId)
  if (label) {
    const attr = label.attributes.find(a => a.id === attrId)
    if (attr && attr.options) {
      const option = attr.options.find(o => o.id === optionId)
      if (option) {
        option.value = value
        hasChanges.value = true
      }
    }
  }
}

// Check if attribute needs options
const needsOptions = (inputType: string) => {
  return ['select', 'radio', 'checkbox'].includes(inputType)
}

// Validate labels
const validateLabels = () => {
  const errors: string[] = []
  
  const names = labelClasses.value.map(l => l.name.toLowerCase())
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicateNames.length > 0) {
    errors.push('Duplicate label names found')
  }
  
  const shortcuts = labelClasses.value.map(l => l.shortcut).filter(Boolean)
  const duplicateShortcuts = shortcuts.filter((shortcut, index) => shortcuts.indexOf(shortcut) !== index)
  if (duplicateShortcuts.length > 0) {
    errors.push('Duplicate keyboard shortcuts found')
  }
  
  if (labelClasses.value.some(l => !l.name.trim())) {
    errors.push('All labels must have a name')
  }
  
  return errors
}

// Save labels
const handleSave = () => {
  const errors = validateLabels()
  if (errors.length > 0) {
    message.error(errors.join(', '))
    return
  }
  
  dialog.warning({
    title: 'Warning: Schema Changes',
    content: 'Changing the label schema may affect existing annotations. Annotations with deleted or modified labels may need to be re-labeled.',
    positiveText: 'Continue & Save',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      confirmSave()
    }
  })
}

const confirmSave = async () => {
  isSaving.value = true
  console.log('💾 Saving label schema...', {
    projectId: props.projectId,
    classesCount: labelClasses.value.length
  })
  
  try {
    const payload = {
      id: labelSchema.value?.id,
      toolType: labelSchema.value?.toolType || 'image',
      classes: labelClasses.value,
      version: labelSchema.value?.version || 0,
      createdAt: labelSchema.value?.createdAt
    }
    
    console.log('📤 Sending payload:', payload)
    
    const response = await $fetch<{ success: boolean; data: any; message: string }>(`/api/projects/labels/${props.projectId}`, {
      method: 'POST',
      body: payload
    })
    
    console.log('✅ Save response:', response)
    
    if (response.success) {
      labelSchema.value = response.data
      hasChanges.value = false
      message.success(response.message || 'Label schema saved successfully!')
    }
  } catch (error: any) {
    console.error('❌ Failed to save label schema:', error)
    message.error(`Failed to save: ${error.message || 'Unknown error'}`)
  } finally {
    isSaving.value = false
  }
}

// Discard changes
const discardChanges = () => {
  dialog.warning({
    title: 'Discard Changes',
    content: 'Are you sure you want to discard all changes?',
    positiveText: 'Discard',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      loadLabelSchema()
      hasChanges.value = false
    }
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading label schema...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Label Schema</h3>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {{ toolTypeInfo }}
        </p>
      </div>
      <NSpace>
        <NButton v-if="hasChanges" text size="small" @click="discardChanges">
          Discard
        </NButton>
        <NButton
          type="primary"
          size="small"
          :disabled="!hasChanges"
          :loading="isSaving"
          @click="handleSave"
        >
          <template #icon>
            <NIcon><Save /></NIcon>
          </template>
          Save Changes
        </NButton>
      </NSpace>
    </div>

    <!-- Label List -->
    <draggable
      v-model="labelClasses"
      item-key="id"
      handle=".drag-handle"
      @end="onDragEnd"
      class="space-y-2"
    >
      <template #item="{ element: label, index }">
        <NCard
          :key="label.id"
          size="small"
          :bordered="false"
        >
        <div class="p-2">
          <div class="flex items-start gap-3">
            <!-- Drag Handle -->
            <div class="drag-handle pt-2 cursor-move text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
              <GripVertical :size="18" />
            </div>

            <!-- Order Number -->
            <div class="pt-2 text-sm font-mono text-gray-500 dark:text-gray-400 w-6">
              {{ index + 1 }}
            </div>

            <!-- Form Fields -->
            <div class="flex-1 space-y-3">
              <!-- Name and Shortcut Row -->
              <NSpace vertical :size="8">
                <div class="flex gap-2">
                  <NFormItem label="Label Name" class="flex-1" label-placement="top" size="small">
                    <NInput
                      :value="label.name"
                      @update:value="(value: string) => updateLabel(label.id, 'name', value)"
                      placeholder="e.g., Person, Vehicle"
                      size="small"
                    />
                  </NFormItem>

                  <NFormItem label="Key" style="width: 80px" label-placement="top" size="small">
                    <NInput
                      :value="label.shortcut"
                      @update:value="(value: string) => updateLabel(label.id, 'shortcut', value)"
                      placeholder="1-9"
                      maxlength="1"
                      size="small"
                    />
                  </NFormItem>

                  <NFormItem label="Color" style="width: 120px" label-placement="top" size="small">
                    <NColorPicker
                      :value="label.color"
                      @update:value="(value: string) => updateLabel(label.id, 'color', value)"
                      :show-alpha="false"
                      size="small"
                    />
                  </NFormItem>
                </div>

                <NFormItem label="Description" label-placement="top" size="small">
                  <NInput
                    :value="label.description"
                    @update:value="(value: string) => updateLabel(label.id, 'description', value)"
                    placeholder="Brief description"
                    size="small"
                  />
                </NFormItem>
              </NSpace>

              <!-- Attributes Section -->
              <div class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Attributes ({{ label.attributes.length }})
                  </span>
                  <NButton
                    text
                    size="tiny"
                    @click="addAttribute(label.id)"
                  >
                    <template #icon>
                      <NIcon :size="14"><Plus /></NIcon>
                    </template>
                    Add
                  </NButton>
                </div>

                <div v-if="label.attributes.length > 0" class="space-y-3">
                  <NCard
                    v-for="attr in label.attributes"
                    :key="attr.id"
                    size="small"
                    class="bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div class="space-y-2">
                      <!-- Attribute Name and Type -->
                      <div class="flex gap-2">
                        <NFormItem label="Name" class="flex-1" label-placement="top" size="small">
                          <NInput
                            :value="attr.name"
                            @update:value="(value: string) => updateAttribute(label.id, attr.id, 'name', value)"
                            placeholder="e.g., Condition, Size"
                            size="small"
                          />
                        </NFormItem>
                        
                        <NFormItem label="Type" style="width: 120px" label-placement="top" size="small">
                          <NSelect
                            :value="attr.inputType"
                            @update:value="(value: string) => updateAttribute(label.id, attr.id, 'inputType', value)"
                            :options="inputTypeOptions"
                            size="small"
                          />
                        </NFormItem>

                        <div class="pt-6">
                          <NButton
                            text
                            type="error"
                            size="small"
                            @click="removeAttribute(label.id, attr.id)"
                            title="Delete attribute"
                          >
                            <template #icon>
                              <NIcon><Trash2 /></NIcon>
                            </template>
                          </NButton>
                        </div>
                      </div>

                      <!-- Required Toggle and Default Value -->
                      <div class="flex gap-2">
                        <NFormItem label="Required" label-placement="left" size="small">
                          <NSwitch
                            :value="attr.required"
                            @update:value="(value: boolean) => updateAttribute(label.id, attr.id, 'required', value)"
                            size="small"
                          />
                        </NFormItem>

                        <NFormItem 
                          v-if="attr.inputType === 'text'" 
                          label="Default Value" 
                          class="flex-1" 
                          label-placement="top" 
                          size="small"
                        >
                          <NInput
                            :value="attr.defaultValue?.toString() || ''"
                            @update:value="(value: string) => updateAttribute(label.id, attr.id, 'defaultValue', value)"
                            placeholder="Optional default"
                            size="small"
                          />
                        </NFormItem>
                      </div>

                      <!-- Number-specific fields -->
                      <div v-if="attr.inputType === 'number'" class="flex gap-2">
                        <NFormItem label="Min" class="flex-1" label-placement="top" size="small">
                          <NInputNumber
                            :value="attr.min"
                            @update:value="(value: number | null) => updateAttribute(label.id, attr.id, 'min', value)"
                            placeholder="Min"
                            size="small"
                          />
                        </NFormItem>
                        <NFormItem label="Max" class="flex-1" label-placement="top" size="small">
                          <NInputNumber
                            :value="attr.max"
                            @update:value="(value: number | null) => updateAttribute(label.id, attr.id, 'max', value)"
                            placeholder="Max"
                            size="small"
                          />
                        </NFormItem>
                        <NFormItem label="Step" class="flex-1" label-placement="top" size="small">
                          <NInputNumber
                            :value="attr.step || 1"
                            @update:value="(value: number | null) => updateAttribute(label.id, attr.id, 'step', value)"
                            placeholder="Step"
                            size="small"
                            :min="0.01"
                          />
                        </NFormItem>
                        <NFormItem label="Default" class="flex-1" label-placement="top" size="small">
                          <NInputNumber
                            :value="attr.defaultValue as number"
                            @update:value="(value: number | null) => updateAttribute(label.id, attr.id, 'defaultValue', value)"
                            placeholder="Default"
                            size="small"
                          />
                        </NFormItem>
                      </div>

                      <!-- Options for select/radio/checkbox -->
                      <div v-if="needsOptions(attr.inputType)" class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Options</span>
                          <NButton
                            text
                            size="tiny"
                            @click="addOption(label.id, attr.id)"
                          >
                            <template #icon>
                              <NIcon :size="12"><Plus /></NIcon>
                            </template>
                            Add Option
                          </NButton>
                        </div>

                        <div v-if="attr.options && attr.options.length > 0" class="space-y-1">
                          <div
                            v-for="(option, optIdx) in attr.options"
                            :key="option.id"
                            class="flex items-center gap-2"
                          >
                            <span class="text-xs text-gray-500 w-4">{{ optIdx + 1 }}</span>
                            <NInput
                              :value="option.value"
                              @update:value="(value: string) => updateOption(label.id, attr.id, option.id, value)"
                              placeholder="Option value"
                              size="small"
                            />
                            <NButton
                              text
                              type="error"
                              size="tiny"
                              @click="removeOption(label.id, attr.id, option.id)"
                            >
                              <template #icon>
                                <NIcon :size="12"><Trash2 /></NIcon>
                              </template>
                            </NButton>
                          </div>
                        </div>

                        <div v-else class="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                          No options defined
                        </div>
                      </div>
                    </div>
                  </NCard>
                </div>

                <div v-else class="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  No attributes defined
                </div>
              </div>
            </div>

            <!-- Delete Button -->
            <NButton
              text
              type="error"
              size="small"
              @click="removeLabel(label.id)"
              title="Delete label"
            >
              <template #icon>
                <NIcon><Trash2 /></NIcon>
              </template>
            </NButton>
          </div>
        </div>
        </NCard>
      </template>
    </draggable>

    <!-- Add New Label Button -->
      <NButton
        dashed
        block
        @click="addLabel"
        size="large"
      >
        <template #icon>
          <NIcon><Plus /></NIcon>
        </template>
        Add New Label Class
      </NButton>

    </div>
  </div>
</template>
