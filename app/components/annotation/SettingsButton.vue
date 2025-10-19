<script setup lang="ts">
import { Settings } from 'lucide-vue-next'

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="emit('click')"
    class="fixed right-4 bottom-4 z-40 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-150"
    title="Settings"
  >
    <Settings :size="16" :stroke-width="2" />
  </button>
</template>
