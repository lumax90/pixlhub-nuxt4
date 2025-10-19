<script setup lang="ts">
import type { ButtonVariant, ButtonSize } from '~/types'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button'
})

const buttonClasses = computed(() => {
  const base = 'pixl-btn'
  
  const variants = {
    primary: 'pixl-btn-primary',
    secondary: 'pixl-btn-secondary',
    ghost: 'pixl-btn-ghost',
    danger: 'bg-pixl-error text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-pixl-error'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-body',
    lg: 'px-6 py-3 text-base'
  }

  return [
    base,
    variants[props.variant],
    sizes[props.size]
  ]
})
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot v-else />
  </button>
</template>
