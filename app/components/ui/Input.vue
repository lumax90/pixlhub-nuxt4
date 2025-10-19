<script setup lang="ts">
import type { InputType } from '~/types'

interface Props {
  modelValue?: string | number
  type?: InputType
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string | number) => emit('update:modelValue', value)
})

const inputClasses = computed(() => [
  'pixl-input',
  props.error && 'border-pixl-error focus:border-pixl-error focus:ring-pixl-error/20'
])
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-pixl-error">*</span>
    </label>
    
    <input
      v-model="inputValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClasses"
    />
    
    <p v-if="error" class="mt-1 text-sm text-pixl-error">
      {{ error }}
    </p>
  </div>
</template>
