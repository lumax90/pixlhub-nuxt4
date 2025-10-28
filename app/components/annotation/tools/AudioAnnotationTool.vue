<script setup lang="ts">
const annotationStore = useAnnotationStore()

onMounted(() => {
  console.log('🎵 Audio Annotation Tool loaded')
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
    <div class="max-w-2xl w-full p-8 text-center">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🎵 Audio Annotation Tool
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Transcription & Speaker Diarization
        </p>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          🚧 Coming soon: Transcribe audio and identify speakers
        </p>
      </div>
    </div>
  </div>
</template>
