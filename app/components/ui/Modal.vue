<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

interface Props {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
}>()

const modalRef = ref<HTMLElement>()

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

const close = () => {
  if (props.closable) {
    emit('update:show', false)
    emit('close')
  }
}

onClickOutside(modalRef, () => {
  if (props.closable) {
    close()
  }
})

// Handle escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.show && props.closable) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="show"
            ref="modalRef"
            :class="['w-full bg-white dark:bg-slate-900 rounded-lg shadow-elevated', sizeClasses[size]]"
          >
            <!-- Header -->
            <div v-if="title || closable" class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 v-if="title" class="text-h3 text-gray-900 dark:text-gray-100">
                {{ title }}
              </h2>
              <button
                v-if="closable"
                @click="close"
                class="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 pixl-transition"
              >
                <X :size="20" class="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-4">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="p-4 border-t border-gray-100 dark:border-gray-800">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
