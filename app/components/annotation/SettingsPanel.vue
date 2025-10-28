<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import { NSwitch, NSlider, NButton, NSpace, NDivider, NIcon, NCard } from 'naive-ui'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { settings, resetImageAdjustments } = useCanvasSettings()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    leave-active-class="transition-all duration-150"
    enter-from-class="opacity-0 scale-95 -translate-y-2"
    enter-to-class="opacity-100 scale-100 translate-y-0"
    leave-from-class="opacity-100 scale-100 translate-y-0"
    leave-to-class="opacity-0 scale-95 -translate-y-2"
  >
    <div
      v-if="isOpen"
      class="fixed right-4 bottom-16 w-64 max-h-[calc(100vh-8rem)] z-50"
      @click.stop
    >
      <NCard size="small" :bordered="true" class="shadow-2xl overflow-hidden" style="padding: 8px;">
        <template #header>
          <div class="flex items-center justify-between" style="padding: 4px 0;">
            <span class="text-xs font-semibold">Canvas Settings</span>
            <NButton text size="tiny" @click="emit('close')">
              <template #icon>
                <span class="text-base">&times;</span>
              </template>
            </NButton>
          </div>
        </template>
        
        <div class="overflow-y-auto max-h-[calc(100vh-12rem)]">
          <NSpace vertical :size="8">
        
      <!-- Display Settings -->
      <div>
        <div class="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">Display</div>
        <NSpace vertical :size="12">
          <div class="flex items-center justify-between">
            <span class="text-sm">Show Labels</span>
            <NSwitch v-model:value="settings.showClasses" size="small" />
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm">Crosshair</span>
            <NSwitch v-model:value="settings.crosshair" size="small" />
          </div>
        </NSpace>
      </div>
        
      <!-- Canvas Settings -->
      <div>
        <div class="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Canvas</div>
        <NSpace vertical :size="8">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Opacity</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.opacity }}%</span>
            </div>
            <NSlider v-model:value="settings.opacity" :min="0" :max="100" :step="1" />
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Point Size</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.pointRadius }}px</span>
            </div>
            <NSlider v-model:value="settings.pointRadius" :min="3" :max="20" :step="1" />
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Border</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.border }}px</span>
            </div>
            <NSlider v-model:value="settings.border" :min="0.5" :max="5" :step="0.5" :marks="{ 0.5: '0.5', 1: '1', 1.5: '1.5', 2: '2', 3: '3', 4: '4', 5: '5' }" />
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Freeform Density</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.freeformDensity }}</span>
            </div>
            <NSlider v-model:value="settings.freeformDensity" :min="1" :max="10" :step="1" />
          </div>
        </NSpace>
      </div>
        
      <!-- Image Adjustments -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">Image</span>
          <NButton text size="tiny" @click="resetImageAdjustments">
            <template #icon>
              <NIcon :size="12"><RotateCcw /></NIcon>
            </template>
            Reset
          </NButton>
        </div>
        
        <NSpace vertical :size="8">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Invert</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.invert }}%</span>
            </div>
            <NSlider v-model:value="settings.invert" :min="0" :max="100" :step="1" />
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Brightness</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.brightness }}%</span>
            </div>
            <NSlider v-model:value="settings.brightness" :min="0" :max="200" :step="1" />
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Contrast</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.contrast }}%</span>
            </div>
            <NSlider v-model:value="settings.contrast" :min="0" :max="200" :step="1" />
          </div>
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs">Saturation</span>
              <span class="text-xs font-mono text-gray-500">{{ settings.saturation }}%</span>
            </div>
            <NSlider v-model:value="settings.saturation" :min="0" :max="200" :step="1" />
          </div>
        </NSpace>
      </div>
          </NSpace>
        </div>
      </NCard>
    </div>
  </Transition>
</template>
