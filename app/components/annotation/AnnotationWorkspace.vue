<script setup lang="ts">
import type { Project } from '~/types'

const props = defineProps<{
  project: Project
  taskId?: string
  readOnly?: boolean
}>()

const annotationStore = useAnnotationStore()

// Ref to the current tool component
const toolRef = ref<any>(null)

// Expose save method to parent
const saveAnnotations = async () => {
  if (toolRef.value?.saveAnnotations) {
    return await toolRef.value.saveAnnotations()
  }
  return false
}

defineExpose({ saveAnnotations })

// Determine which tool component to load based on project tool type
const currentToolComponent = computed(() => {
  const toolType = props.project.toolType || 'image'
  
  switch (toolType) {
    case 'image':
      return resolveComponent('AnnotationToolsImageAnnotationTool')
    case 'text':
      return resolveComponent('AnnotationToolsTextAnnotationTool')
    case 'sentiment':
      return resolveComponent('AnnotationToolsTextAnnotationTool') // Uses text tool with sentiment mode
    case 'classification':
      return resolveComponent('AnnotationToolsClassificationTool')
    case 'rlhf':
      return resolveComponent('AnnotationToolsRLHFTool')
    case 'emotion':
      return resolveComponent('AnnotationToolsEmotionTool')
    case 'video':
      return resolveComponent('AnnotationToolsVideoAnnotationTool')
    case 'audio':
      return resolveComponent('AnnotationToolsAudioAnnotationTool')
    case 'document':
      return resolveComponent('AnnotationToolsDocumentAnnotationTool')
    default:
      console.warn(`Unknown tool type: ${toolType}, falling back to image`)
      return resolveComponent('AnnotationToolsImageAnnotationTool')
  }
})

// Watch tool type changes
watch(() => props.project.toolType, () => {
  // Tool type changed
}, { immediate: true })
</script>

<template>
  <div class="annotation-workspace w-full h-full">
    <!-- Dynamic Tool Component -->
    <component 
      ref="toolRef"
      :is="currentToolComponent" 
      :project="project" 
      :task-id="taskId"
      :read-only="readOnly"
    />
  </div>
</template>

<style scoped>
.annotation-workspace {
  position: relative;
  overflow: hidden;
}
</style>
