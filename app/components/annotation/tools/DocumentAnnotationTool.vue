<script setup lang="ts">
const annotationStore = useAnnotationStore()

onMounted(() => {
  console.log('📄 Document Annotation Tool loaded')
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
    <div class="max-w-2xl w-full p-8 text-center">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📄 Document Annotation Tool
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          OCR & Layout Detection
        </p>
      </div>
      
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          🚧 Coming soon: Annotate document layouts and extract text regions
        </p>
      </div>
    </div>
  </div>
</template>
