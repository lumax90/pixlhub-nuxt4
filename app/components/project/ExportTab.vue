<script setup lang="ts">
import { Download, FileJson, FileCode, FileText, AlertCircle, CheckCircle, History, Calendar, Code2 } from 'lucide-vue-next'
import { NCard, NButton, NRadioGroup, NRadio, NCheckbox, NSpace, NAlert, NStatistic, NProgress, useMessage, NTabs, NTabPane, NDataTable, NTag, NDatePicker, NInput, NCollapse, NCollapseItem } from 'naive-ui'

const props = defineProps<{
  projectId: string
}>()

const message = useMessage()

// Export state
const activeTab = ref('new-export')
const selectedFormat = ref<'json' | 'coco' | 'yolo' | 'yolov8-seg' | 'pascal-voc' | 'csv' | 'custom'>('json')
const isExporting = ref(false)
const exportProgress = ref(0)

// Date range filter
const dateRange = ref<[number, number] | null>(null)

// Custom template
const customTemplate = ref('')
const customTemplateError = ref('')

// Export history
const exportHistory = ref<any[]>([])
const isLoadingHistory = ref(false)

// Export options
const exportOptions = ref({
  includeMetadata: true,
  includeNonReviewed: false,
  includeReviewMetadata: false,
  splitDataset: false,
  trainSplit: 80,
  valSplit: 10,
  testSplit: 10
})

// Export stats
const exportStats = ref({
  completedTasks: 0,
  labeledTasks: 0,
  totalAnnotations: 0,
  bboxCount: 0,
  polygonCount: 0,
  pointCount: 0
})

const isLoadingStats = ref(false)

// Format definitions
const formats = [
  {
    id: 'json',
    name: 'JSON (Native)',
    description: 'PixlHub native format - supports all annotation types',
    icon: FileJson,
    supports: ['bbox', 'polygon', 'point', 'segmentation'],
    compatible: true
  },
  {
    id: 'coco',
    name: 'COCO JSON',
    description: 'Common Objects in Context format - bbox, polygon, keypoints',
    icon: FileJson,
    supports: ['bbox', 'polygon', 'point'],
    compatible: true
  },
  {
    id: 'yolo',
    name: 'YOLO (Darknet)',
    description: 'Bounding boxes only - normalized coordinates',
    icon: FileText,
    supports: ['bbox'],
    compatible: true,
    warning: 'Polygons will be converted to bounding boxes'
  },
  {
    id: 'yolov8-seg',
    name: 'YOLOv8 Segmentation',
    description: 'Supports polygons as normalized coordinates',
    icon: FileText,
    supports: ['bbox', 'polygon'],
    compatible: true
  },
  {
    id: 'pascal-voc',
    name: 'Pascal VOC (XML)',
    description: 'XML format - bounding boxes only',
    icon: FileCode,
    supports: ['bbox'],
    compatible: true,
    warning: 'Polygons will be converted to bounding boxes'
  },
  {
    id: 'csv',
    name: 'CSV (Simple)',
    description: 'Tabular format - good for classification and simple bbox',
    icon: FileText,
    supports: ['bbox'],
    compatible: true
  },
  {
    id: 'custom',
    name: 'Custom Template',
    description: 'Define your own JSON structure with placeholders',
    icon: FileJson,
    supports: ['bbox', 'polygon', 'point', 'segmentation'],
    compatible: true
  }
]

const selectedFormatInfo = computed(() => {
  return formats.find(f => f.id === selectedFormat.value)
})

// Check compatibility
const compatibilityWarnings = computed(() => {
  const warnings: Array<{ type: 'warning' | 'info' | 'error'; message: string }> = []
  const format = selectedFormatInfo.value
  
  if (!format) return warnings
  
  if (!format.supports.includes('polygon') && exportStats.value.polygonCount > 0) {
    warnings.push({
      type: 'warning',
      message: `${exportStats.value.polygonCount} polygon annotations will be converted to bounding boxes`
    })
  }
  
  if (!format.supports.includes('point') && exportStats.value.pointCount > 0) {
    warnings.push({
      type: 'warning',
      message: `${exportStats.value.pointCount} point annotations will be excluded or converted`
    })
  }
  
  return warnings
})

// Load export stats
const loadExportStats = async () => {
  isLoadingStats.value = true
  try {
    const response = await $fetch(`/api/projects/${props.projectId}/export-stats`)
    if (response.success) {
      exportStats.value = response.data
    }
  } catch (error) {
    console.error('Failed to load export stats:', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Handle export
const handleExport = async () => {
  isExporting.value = true
  exportProgress.value = 0
  
  try {
    const response = await $fetch(`/api/projects/${props.projectId}/export`, {
      method: 'POST',
      body: {
        format: selectedFormat.value,
        options: exportOptions.value
      }
    })
    
    if (response.success) {
      message.success('Export completed successfully!')
      
      // Trigger file download
      if (response.data.downloadUrl) {
        const link = document.createElement('a')
        link.href = response.data.downloadUrl
        link.download = response.data.filename || 'export.zip'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  } catch (error) {
    console.error('Export failed:', error)
    message.error('Failed to export annotations')
  } finally {
    isExporting.value = false
    exportProgress.value = 0
  }
}

// Preview export
const handlePreview = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/projects/${props.projectId}/export-preview`, {
      method: 'POST',
      body: {
        format: selectedFormat.value,
        options: exportOptions.value
      }
    })
    
    if (response.success && response.data) {
      // Show preview in modal or new tab
      console.log('Preview:', response.data)
      message.info('Preview generated - check console')
    }
  } catch (error) {
    console.error('Preview failed:', error)
    message.error('Failed to generate preview')
  }
}

onMounted(() => {
  loadExportStats()
  loadExportHistory()
})

// Load export history
const loadExportHistory = async () => {
  isLoadingHistory.value = true
  try {
    const response = await $fetch(`/api/projects/${props.projectId}/exports`)
    if (response.success) {
      exportHistory.value = response.data
    }
  } catch (error) {
    console.error('Failed to load export history:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

// Download previous export
const downloadExport = async (exportId: string) => {
  try {
    const response = await $fetch(`/api/exports/${exportId}/download`)
    if (response.success && response.data.downloadUrl) {
      const link = document.createElement('a')
      link.href = response.data.downloadUrl
      link.download = response.data.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('Download started')
    }
  } catch (error: any) {
    console.error('Download failed:', error)
    if (error.statusCode === 410) {
      message.error('Export has expired')
    } else {
      message.error('Failed to download export')
    }
  }
}

// Validate custom template
const validateCustomTemplate = () => {
  if (!customTemplate.value.trim()) {
    customTemplateError.value = ''
    return true
  }
  
  try {
    JSON.parse(customTemplate.value)
    customTemplateError.value = ''
    return true
  } catch (e) {
    customTemplateError.value = 'Invalid JSON format'
    return false
  }
}

// History table columns
const historyColumns = [
  { title: 'Version', key: 'version', width: 80 },
  { title: 'Format', key: 'format', width: 120 },
  { title: 'Filename', key: 'filename' },
  { title: 'Tasks', key: 'taskCount', width: 80 },
  { title: 'Annotations', key: 'annotationCount', width: 120 },
  { title: 'Size', key: 'fileSize', width: 100 },
  { title: 'Date', key: 'createdAt', width: 180 },
  { title: 'Actions', key: 'actions', width: 100 }
]

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <NTabs v-model:value="activeTab" type="line" size="medium">
      <!-- New Export Tab -->
      <NTabPane name="new-export" tab="New Export">
        <div class="space-y-6 pt-4">
          <!-- Export Summary -->
          <NCard title="Export Summary" size="small">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NStatistic label="Completed Tasks" :value="exportStats.completedTasks" />
        <NStatistic label="Labeled Tasks" :value="exportStats.labeledTasks" />
        <NStatistic label="Total Annotations" :value="exportStats.totalAnnotations" />
        <NStatistic label="Ready to Export" :value="exportStats.completedTasks" />
      </div>
      
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div class="flex justify-between">
            <span>Bounding Boxes:</span>
            <span class="font-medium">{{ exportStats.bboxCount }}</span>
          </div>
          <div class="flex justify-between">
            <span>Polygons:</span>
            <span class="font-medium">{{ exportStats.polygonCount }}</span>
          </div>
          <div class="flex justify-between">
            <span>Points:</span>
            <span class="font-medium">{{ exportStats.pointCount }}</span>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Format Selection -->
    <NCard title="Select Export Format" size="small">
      <NRadioGroup v-model:value="selectedFormat" class="space-y-3">
        <div
          v-for="format in formats"
          :key="format.id"
          class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
          :class="[selectedFormat === format.id ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : '']"
          @click="selectedFormat = format.id as typeof selectedFormat"
        >
          <NRadio :value="format.id" class="w-full">
            <div class="flex items-start gap-3">
              <component :is="format.icon" :size="20" class="mt-0.5 flex-shrink-0" />
              <div class="flex-1">
                <div class="font-medium text-sm">{{ format.name }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {{ format.description }}
                </div>
                <div class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="support in format.supports"
                    :key="support"
                    class="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                  >
                    {{ support }}
                  </span>
                </div>
              </div>
            </div>
          </NRadio>
        </div>
      </NRadioGroup>
    </NCard>

    <!-- Compatibility Warnings -->
    <div v-if="compatibilityWarnings.length > 0" class="space-y-2">
      <NAlert
        v-for="(warning, index) in compatibilityWarnings"
        :key="index"
        :type="warning.type"
        :title="warning.type === 'warning' ? 'Format Compatibility' : 'Information'"
      >
        {{ warning.message }}
      </NAlert>
    </div>

    <!-- Export Options -->
    <NCard title="Export Options" size="small">
      <NSpace vertical :size="16">
        <NCheckbox v-model:checked="exportOptions.includeMetadata">
          Include asset metadata (dimensions, batch info, etc.)
        </NCheckbox>
        
        <NCheckbox v-model:checked="exportOptions.includeNonReviewed">
          Include non-reviewed tasks (labeled but not reviewed)
        </NCheckbox>
        
        <NCheckbox v-model:checked="exportOptions.includeReviewMetadata">
          Include review metadata (reviewer, approval date, etc.)
        </NCheckbox>
        
        <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
          <NCheckbox v-model:checked="exportOptions.splitDataset">
            Split dataset into train/val/test
          </NCheckbox>
          
          <div v-if="exportOptions.splitDataset" class="ml-6 mt-3 space-y-2">
            <div class="flex items-center gap-3">
              <span class="text-xs w-12">Train:</span>
              <input
                v-model.number="exportOptions.trainSplit"
                type="number"
                min="0"
                max="100"
                class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <span class="text-xs">%</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs w-12">Val:</span>
              <input
                v-model.number="exportOptions.valSplit"
                type="number"
                min="0"
                max="100"
                class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <span class="text-xs">%</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs w-12">Test:</span>
              <input
                v-model.number="exportOptions.testSplit"
                type="number"
                min="0"
                max="100"
                class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <span class="text-xs">%</span>
            </div>
          </div>
        </div>
      </NSpace>
    </NCard>

    <!-- Export Progress -->
    <NCard v-if="isExporting" size="small">
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span>Exporting annotations...</span>
          <span>{{ exportProgress }}%</span>
        </div>
        <NProgress :percentage="exportProgress" :show-indicator="false" />
      </div>
    </NCard>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3">
      <NButton @click="handlePreview" :disabled="isExporting">
        Preview
      </NButton>
      <NButton
        type="primary"
        @click="handleExport"
        :loading="isExporting"
        :disabled="exportStats.completedTasks === 0 && !exportOptions.includeNonReviewed"
      >
        <template #icon>
          <NIcon><Download /></NIcon>
        </template>
        Export & Download
      </NButton>
    </div>
  </div>
</template>
