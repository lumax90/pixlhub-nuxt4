<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padding?: boolean
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: true,
  hoverable: false
})

const cardClasses = computed(() => [
  'pixl-card',
  !props.padding && '!p-0',
  props.hoverable && 'hover:shadow-elevated cursor-pointer pixl-transition'
])
</script>

<template>
  <div :class="cardClasses">
    <div v-if="title || subtitle" class="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
      <h3 v-if="title" class="text-h3 text-gray-900 dark:text-gray-100">
        {{ title }}
      </h3>
      <p v-if="subtitle" class="text-small text-gray-600 dark:text-gray-400 mt-1">
        {{ subtitle }}
      </p>
    </div>
    
    <slot />
  </div>
</template>
