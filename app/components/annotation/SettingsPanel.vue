<script setup lang="ts">
import { X, RotateCcw } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const settings = ref({
  showClasses: true,
  crosshair: false,
  opacity: 85,
  paintRadius: 5,
  border: 2,
  invert: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100
})

const resetImageAdjustments = () => {
  settings.value.invert = 0
  settings.value.brightness = 100
  settings.value.contrast = 100
  settings.value.saturation = 100
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    leave-active-class="transition-all duration-200"
    enter-from-class="opacity-0 scale-95 translate-y-2"
    leave-to-class="opacity-0 scale-95 translate-y-2"
  >
    <div
      v-if="isOpen"
      class="fixed right-4 bottom-14 w-56 max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col"
    >
      <div class="p-2.5 overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            @click="emit('close')"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X :size="14" class="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
        
        <!-- Show Classes Toggle -->
        <div class="mb-1.5">
          <div class="flex items-center justify-between gap-2">
            <label class="text-xs font-medium text-gray-900 dark:text-gray-100">Show Classes</label>
            <button
              @click="settings.showClasses = !settings.showClasses"
              :class="[
                'relative w-6 h-3 rounded-full transition-colors flex-shrink-0',
                settings.showClasses ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
              ]"
            >
              <span
                :class="[
                  'absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform',
                  settings.showClasses ? 'translate-x-3' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>
        
        <!-- Crosshair Toggle -->
        <div class="mb-1.5">
          <div class="flex items-center justify-between gap-2">
            <label class="text-xs font-medium text-gray-900 dark:text-gray-100">Crosshair</label>
            <button
              @click="settings.crosshair = !settings.crosshair"
              :class="[
                'relative w-6 h-3 rounded-full transition-colors flex-shrink-0',
                settings.crosshair ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
              ]"
            >
              <span
                :class="[
                  'absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform',
                  settings.crosshair ? 'translate-x-3' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>
        
        <!-- Opacity -->
        <div class="mb-1.5">
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-gray-900 dark:text-gray-100">Opacity</label>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.opacity }}%</span>
          </div>
          <input
            v-model="settings.opacity"
            type="range"
            min="0"
            max="100"
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <!-- Paint Radius -->
        <div class="mb-1.5">
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-gray-900 dark:text-gray-100">Paint Radius</label>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.paintRadius }}px</span>
          </div>
          <input
            v-model="settings.paintRadius"
            type="range"
            min="1"
            max="50"
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <!-- Border -->
        <div class="mb-1.5">
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-gray-900 dark:text-gray-100">Border</label>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.border }}px</span>
          </div>
          <input
            v-model="settings.border"
            type="range"
            min="1"
            max="10"
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <!-- Image Adjustments -->
        <div class="mb-1.5">
          <div class="flex items-center justify-between mb-1.5">
            <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Image Adjustments</h3>
            <button
              @click="resetImageAdjustments"
              class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Reset"
            >
              <RotateCcw :size="12" class="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <!-- Invert -->
          <div class="mb-1.5">
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs text-gray-700 dark:text-gray-300">Invert</label>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.invert }}%</span>
            </div>
            <input
              v-model="settings.invert"
              type="range"
              min="0"
              max="100"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <!-- Brightness -->
          <div class="mb-1.5">
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs text-gray-700 dark:text-gray-300">Brightness</label>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.brightness }}%</span>
            </div>
            <input
              v-model="settings.brightness"
              type="range"
              min="0"
              max="200"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <!-- Contrast -->
          <div class="mb-1.5">
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs text-gray-700 dark:text-gray-300">Contrast</label>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.contrast }}%</span>
            </div>
            <input
              v-model="settings.contrast"
              type="range"
              min="0"
              max="200"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <!-- Saturation -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs text-gray-700 dark:text-gray-300">Saturation</label>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ settings.saturation }}%</span>
            </div>
            <input
              v-model="settings.saturation"
              type="range"
              min="0"
              max="200"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
