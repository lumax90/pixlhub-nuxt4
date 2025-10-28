<script setup lang="ts">
import { RefreshCw, Shuffle, Eye, EyeOff, Trash2 } from 'lucide-vue-next'
import { NButton, NIcon, NList, NListItem, NDivider, NEmpty, useDialog, useMessage } from 'naive-ui'
import type { Label } from '~/types'

const annotationStore = useAnnotationStore()
const dialog = useDialog()
const message = useMessage()

const props = defineProps<{
  labels: Label[]
}>()

const objectsHeight = ref(400) // Start with larger default height
const isResizing = ref(false)
const objectsContainerRef = ref<HTMLElement | null>(null)
const objectsGroupBy = ref<'none' | 'label' | 'type'>('none')
const allObjectsVisible = ref(true)

// Auto-scroll to selected annotation
watch(() => annotationStore.selectedAnnotationId, (newId) => {
  if (!newId || !objectsContainerRef.value) return
  
  nextTick(() => {
    const selectedElement = objectsContainerRef.value?.querySelector(`[data-annotation-id="${newId}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
})

// Toggle group by mode
function toggleGroupBy() {
  if (objectsGroupBy.value === 'none') {
    objectsGroupBy.value = 'label'
  } else if (objectsGroupBy.value === 'label') {
    objectsGroupBy.value = 'type'
  } else {
    objectsGroupBy.value = 'none'
  }
}

// Toggle all objects visibility
function toggleAllVisibility() {
  allObjectsVisible.value = !allObjectsVisible.value
  annotationStore.annotations.forEach(ann => {
    if (ann.visible !== allObjectsVisible.value) {
      annotationStore.toggleAnnotationVisibility(ann.id)
    }
  })
}

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  const newHeight = window.innerHeight - e.clientY - 56 // 56px for header
  objectsHeight.value = Math.max(100, Math.min(400, newHeight))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Get annotation type icon/label
function getAnnotationType(type: string): string {
  const types: Record<string, string> = {
    'bounding-box': 'Box',
    'polygon': 'Poly',
    'point': 'Point',
    'segmentation': 'Seg'
  }
  return types[type] || type
}

// Group annotations
const groupedAnnotations = computed(() => {
  const annotations = annotationStore.annotations
  
  if (objectsGroupBy.value === 'none') {
    return [{ title: null, items: annotations }]
  }
  
  if (objectsGroupBy.value === 'label') {
    // Group by label
    const groups: Record<string, typeof annotations> = {}
    annotations.forEach(ann => {
      const labelName = props.labels.find(l => l.id === ann.labelId)?.name || 'Unknown'
      if (!groups[labelName]) {
        groups[labelName] = []
      }
      groups[labelName].push(ann)
    })
    return Object.entries(groups).map(([title, items]) => ({ title, items }))
  }
  
  if (objectsGroupBy.value === 'type') {
    // Group by type
    const groups: Record<string, typeof annotations> = {}
    annotations.forEach(ann => {
      const typeName = getAnnotationType(ann.type)
      if (!groups[typeName]) {
        groups[typeName] = []
      }
      groups[typeName].push(ann)
    })
    return Object.entries(groups).map(([title, items]) => ({ title, items }))
  }
  
  return [{ title: null, items: annotations }]
})

// Delete annotation
function deleteAnnotation(e: Event, id: string) {
  e.stopPropagation()
  annotationStore.deleteAnnotation(id)
}

// Toggle visibility
function toggleVisibility(e: Event, id: string) {
  e.stopPropagation()
  annotationStore.toggleAnnotationVisibility(id)
}

// Clear all annotations with confirmation
function clearAllAnnotations() {
  const count = annotationStore.annotations.length
  
  if (count === 0) {
    message.warning('No annotations to clear')
    return
  }
  
  dialog.warning({
    title: 'Clear All Annotations',
    content: `Are you sure you want to delete all ${count} annotation${count > 1 ? 's' : ''}? This action cannot be undone.`,
    positiveText: 'Clear All',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      // Clear all annotations
      const allIds = annotationStore.annotations.map(a => a.id)
      allIds.forEach(id => annotationStore.deleteAnnotation(id))
      message.success(`Cleared ${count} annotation${count > 1 ? 's' : ''}`)
    }
  })
}
</script>

<template>
  <div class="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
    <!-- Labels Section -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <div class="px-3 py-2.5 flex items-center justify-between">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Labels ({{ labels.length }})
        </h3>
        <div class="flex items-center gap-1">
          <NButton 
            text 
            size="tiny" 
            circle
            @click="clearAllAnnotations"
            title="Clear all annotations"
          >
            <template #icon>
              <NIcon :size="12"><RefreshCw /></NIcon>
            </template>
          </NButton>
          <NButton text size="tiny" circle title="Shuffle colors (coming soon)">
            <template #icon>
              <NIcon :size="12"><Shuffle /></NIcon>
            </template>
          </NButton>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <NList hoverable clickable>
          <NListItem
            v-for="label in labels"
            :key="label.id"
            @click="annotationStore.setSelectedLabel(label.id)"
            :class="annotationStore.selectedLabelId === label.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''"
          >
            <div class="flex items-center gap-2.5 w-full">
              <span class="flex-1 text-[13px] font-medium">
                {{ label.name }}
              </span>
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: label.color }"
                />
                <span class="text-[13px] text-gray-400 dark:text-gray-500 font-mono w-4 text-right">
                  {{ label.hotkey }}
                </span>
              </div>
            </div>
          </NListItem>
        </NList>
      </div>
    </div>
    
    <!-- Objects Section -->
    <div class="border-t border-gray-200 dark:border-gray-800">
      <!-- Resize Handle -->
      <div
        @mousedown="startResize"
        class="h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
        :class="isResizing ? 'bg-blue-500' : ''"
      />
      <div class="px-3 py-2.5 flex items-center justify-between">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Objects ({{ annotationStore.annotations.length }})
        </h3>
        <div class="flex items-center gap-1">
          <!-- Group By Button -->
          <NButton 
            text 
            size="tiny" 
            circle
            @click="toggleGroupBy"
            :title="objectsGroupBy === 'none' ? 'Group by label' : objectsGroupBy === 'label' ? 'Group by type' : 'No grouping'"
          >
            <template #icon>
              <svg v-if="objectsGroupBy === 'none'" width="12" height="12" viewBox="0 0 14 14" fill="none" class="text-gray-500 dark:text-gray-400">
                <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" stroke-width="1"/>
                <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1"/>
                <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1"/>
              </svg>
              <svg v-else-if="objectsGroupBy === 'label'" width="12" height="12" viewBox="0 0 14 14" fill="none" class="text-blue-500 dark:text-blue-400">
                <rect x="2" y="2" width="3" height="3" rx="0.5" fill="currentColor"/>
                <line x1="6" y1="3.5" x2="12" y2="3.5" stroke="currentColor" stroke-width="1"/>
                <rect x="2" y="6" width="3" height="3" rx="0.5" fill="currentColor"/>
                <line x1="6" y1="7.5" x2="12" y2="7.5" stroke="currentColor" stroke-width="1"/>
                <rect x="2" y="10" width="3" height="3" rx="0.5" fill="currentColor"/>
                <line x1="6" y1="11.5" x2="12" y2="11.5" stroke="currentColor" stroke-width="1"/>
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 14 14" fill="none" class="text-blue-500 dark:text-blue-400">
                <rect x="2" y="2" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
                <rect x="8" y="2" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
                <rect x="2" y="8" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
                <rect x="8" y="8" width="4" height="4" rx="0.5" stroke="currentColor" stroke-width="1"/>
              </svg>
            </template>
          </NButton>
          
          <!-- Toggle All Visibility Button -->
          <NButton 
            text 
            size="tiny" 
            circle
            @click="toggleAllVisibility"
            :title="allObjectsVisible ? 'Hide all objects' : 'Show all objects'"
          >
            <template #icon>
              <NIcon :size="12">
                <Eye v-if="allObjectsVisible" />
                <EyeOff v-else />
              </NIcon>
            </template>
          </NButton>
        </div>
      </div>
      
      <div ref="objectsContainerRef" class="overflow-y-auto" :style="{ height: `${objectsHeight}px` }">
        <div v-if="annotationStore.annotations.length === 0" class="px-3 py-8">
          <NEmpty description="No annotations yet" size="small" />
        </div>
        
        <div v-else>
          <div v-for="group in groupedAnnotations" :key="group.title || 'default'">
            <!-- Group Header -->
            <div v-if="group.title" class="px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <span class="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {{ group.title }} ({{ group.items.length }})
              </span>
            </div>
            
            <!-- Group Items -->
            <div
              v-for="(ann, index) in group.items"
              :key="ann.id"
              :data-annotation-id="ann.id"
              @click="annotationStore.selectAnnotation(ann.id)"
              :class="[
                'group w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-l-2',
                annotationStore.selectedAnnotationId === ann.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                  : 'border-transparent',
                !ann.visible ? 'opacity-40' : ''
              ]"
            >
            <!-- Color dot -->
            <div
              class="w-1.5 h-1.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: labels.find(l => l.id === ann.labelId)?.color || '#6B7280' }"
            />
            
            <!-- Content -->
            <div class="flex-1 min-w-0 flex items-center gap-1.5">
              <span class="text-[12px] font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ labels.find(l => l.id === ann.labelId)?.name || 'Unknown' }}
              </span>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">
                #{{ index + 1 }}
              </span>
              <span class="text-[10px] text-gray-500 dark:text-gray-400 font-mono flex-shrink-0 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                {{ getAnnotationType(ann.type) }}
              </span>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <NButton
                text
                size="tiny"
                circle
                @click="(e) => toggleVisibility(e, ann.id)"
                :title="ann.visible ? 'Hide' : 'Show'"
              >
                <template #icon>
                  <NIcon :size="11">
                    <Eye v-if="ann.visible" />
                    <EyeOff v-else />
                  </NIcon>
                </template>
              </NButton>
              <NButton
                text
                type="error"
                size="tiny"
                circle
                @click="(e) => deleteAnnotation(e, ann.id)"
                title="Delete"
              >
                <template #icon>
                  <NIcon :size="11"><Trash2 /></NIcon>
                </template>
              </NButton>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
