<script setup lang="ts">
import { Trash2, X, Eye, EyeOff, Copy, Tag } from 'lucide-vue-next'
import { NInput, NInputNumber, NSelect, NRadioGroup, NRadio, NCheckboxGroup, NCheckbox, NButton, NIcon, NDivider } from 'naive-ui'
import type { Annotation, LabelClass, LabelAttribute } from '~/types'

const props = defineProps<{
  annotation: Annotation | null
  label: LabelClass | null
  position: { x: number; y: number }
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  delete: []
  updateAttribute: [attributeId: string, value: any]
}>()

const annotationStore = useAnnotationStore()

// Local state for attribute values
const attributeValues = ref<Record<string, any>>({})

// Initialize attribute values when annotation changes
watch(() => props.annotation, (newAnnotation) => {
  if (newAnnotation?.attributes) {
    attributeValues.value = { ...newAnnotation.attributes }
  } else {
    attributeValues.value = {}
  }
}, { immediate: true })

// Handle attribute change
function handleAttributeChange(attributeId: string, value: any) {
  attributeValues.value[attributeId] = value
  emit('updateAttribute', attributeId, value)
}

// Handle checkbox toggle
function toggleCheckbox(attributeId: string, optionValue: string) {
  const current = attributeValues.value[attributeId] || []
  const index = current.indexOf(optionValue)
  
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(optionValue)
  }
  
  handleAttributeChange(attributeId, [...current])
}

// Check if checkbox is selected
function isCheckboxSelected(attributeId: string, optionValue: string): boolean {
  const current = attributeValues.value[attributeId] || []
  return current.includes(optionValue)
}
</script>

<template>
  <!-- Backdrop to close on outside click -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9998]"
    @click="emit('close')"
    @mousedown.right="emit('close')"
  />
  
  <Transition
    enter-active-class="transition-all duration-150"
    leave-active-class="transition-all duration-100"
    enter-from-class="opacity-0 scale-95"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="isOpen && annotation && label"
      :style="{ 
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000
      }"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl min-w-[200px] max-w-[280px] overflow-visible"
      @click.stop
      @contextmenu.prevent.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900/50">
        <div class="flex items-center gap-1.5">
          <div
            class="w-2 h-2 rounded-sm"
            :style="{ backgroundColor: label.color }"
          />
          <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ label.name }}</span>
        </div>
        <NButton
          text
          size="tiny"
          @click="emit('close')"
        >
          <template #icon>
            <NIcon :size="14"><X /></NIcon>
          </template>
        </NButton>
      </div>

      <!-- Attributes -->
      <div v-if="label.attributes && label.attributes.length > 0" class="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
        <div v-for="attr in label.attributes" :key="attr.id" class="space-y-0.5">
          <!-- Text Input -->
          <div v-if="attr.inputType === 'text'">
            <label class="text-[10px] font-medium text-gray-600 dark:text-gray-400 block mb-0.5">
              {{ attr.name }}<span v-if="attr.required" class="text-red-500 ml-0.5">*</span>
            </label>
            <NInput
              size="small"
              :value="attributeValues[attr.id] || attr.defaultValue || ''"
              @update:value="(val) => handleAttributeChange(attr.id, val)"
              :placeholder="attr.defaultValue?.toString() || ''"
            />
          </div>

          <!-- Number Input -->
          <div v-if="attr.inputType === 'number'">
            <label class="text-[10px] font-medium text-gray-600 dark:text-gray-400 block mb-0.5">
              {{ attr.name }}<span v-if="attr.required" class="text-red-500 ml-0.5">*</span>
            </label>
            <NInputNumber
              size="small"
              :value="attributeValues[attr.id] || attr.defaultValue || 0"
              @update:value="(val) => handleAttributeChange(attr.id, val)"
              :min="attr.min"
              :max="attr.max"
              :step="attr.step"
              class="w-full"
            />
          </div>

          <!-- Select Dropdown -->
          <div v-if="attr.inputType === 'select'">
            <label class="text-[10px] font-medium text-gray-600 dark:text-gray-400 block mb-0.5">
              {{ attr.name }}<span v-if="attr.required" class="text-red-500 ml-0.5">*</span>
            </label>
            <NSelect
              size="small"
              :value="attributeValues[attr.id] || attr.defaultValue || null"
              @update:value="(val) => handleAttributeChange(attr.id, val)"
              :options="attr.options?.map(opt => ({ label: opt.value, value: opt.value })) || []"
              placeholder="Select..."
              :to="false"
              :z-index="10001"
            />
          </div>

          <!-- Radio Buttons -->
          <div v-if="attr.inputType === 'radio'">
            <label class="text-[10px] font-medium text-gray-600 dark:text-gray-400 block mb-1">
              {{ attr.name }}<span v-if="attr.required" class="text-red-500 ml-0.5">*</span>
            </label>
            <NRadioGroup
              size="small"
              :value="attributeValues[attr.id]"
              @update:value="(val) => handleAttributeChange(attr.id, val)"
            >
              <div class="space-y-0.5">
                <NRadio
                  v-for="option in attr.options"
                  :key="option.value"
                  :value="option.value"
                  :label="option.value"
                  class="text-xs"
                />
              </div>
            </NRadioGroup>
          </div>

          <!-- Checkboxes -->
          <div v-if="attr.inputType === 'checkbox'">
            <label class="text-[10px] font-medium text-gray-600 dark:text-gray-400 block mb-1">
              {{ attr.name }}<span v-if="attr.required" class="text-red-500 ml-0.5">*</span>
            </label>
            <NCheckboxGroup
              :value="attributeValues[attr.id] || []"
              @update:value="(val) => handleAttributeChange(attr.id, val)"
            >
              <div class="space-y-0.5">
                <NCheckbox
                  v-for="option in attr.options"
                  :key="option.value"
                  :value="option.value"
                  :label="option.value"
                  size="small"
                  class="text-xs"
                />
              </div>
            </NCheckboxGroup>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-1.5">
        <NButton
          size="small"
          type="error"
          secondary
          block
          @click="emit('delete')"
        >
          <template #icon>
            <NIcon><Trash2 /></NIcon>
          </template>
          Delete
        </NButton>
      </div>
    </div>
  </Transition>
</template>
