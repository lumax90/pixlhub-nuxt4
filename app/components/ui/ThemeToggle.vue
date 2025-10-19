<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 pixl-transition"
    aria-label="Toggle theme"
  >
    <Sun v-if="isDark" :size="20" class="text-gray-600 dark:text-gray-400" />
    <Moon v-else :size="20" class="text-gray-600 dark:text-gray-400" />
  </button>
</template>
