<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
import { NButton, NIcon } from 'naive-ui'

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="fixed bottom-4 z-40" style="right: calc(32px + 1rem);">
    <NButton
      circle
      type="primary"
      size="medium"
      @click="emit('click')"
      title="Canvas Settings"
    >
      <template #icon>
        <NIcon :size="18">
          <Settings />
        </NIcon>
      </template>
    </NButton>
  </div>
</template>
