<script setup lang="ts">
import { Download, History, Code2, Calendar, ChevronRight } from 'lucide-vue-next'
import { NCard, NButton, NRadioGroup, NRadio, NCheckbox, NSpace, NAlert, NStatistic, NProgress, useMessage, NTabs, NTabPane, NDataTable, NTag, NDatePicker, NInput, NCollapse, NCollapseItem, NIcon, NList, NListItem, NThing } from 'naive-ui'

const props = defineProps<{
  projectId: string
  project?: any
}>()

const message = useMessage()

// Tabs
const activeTab = ref('new-export')

// Export state
const selectedFormat = ref<'json' | 'coco' | 'yolo' | 'yolov8-seg' | 'pascal-voc' | 'csv' | 'custom'>('json')
const isExporting = ref(false)

// Date range filter
const dateRange = ref<[number, number] | null>(null)

// Custom template
const customTemplate = ref(`{
  "image_path": "{{asset.name}}",
  "image_url": "{{asset.url}}",
  "labels": "{{annotations.map(a => a.label.name)}}",
  "boxes": "{{annotations.map(a => a.bbox)}}",
  "metadata": {
    "width": "{{asset.width}}",
    "height": "{{asset.height}}"
  }
}`)
const customTemplateError = ref('')
const isSavingTemplate = ref(false)
const savedTemplates = ref<Array<{ name: string; template: string }>>([])
const templateName = ref('')

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
  pointCount: 0,
  labelStats: {} as Record<string, number>
})

// Export history
const exportHistory = ref<any[]>([])
const isLoadingHistory = ref(false)
const isLoadingStats = ref(false)

// Preview
const previewTab = ref<'schema' | 'live'>('schema')
const livePreview = ref('')
const isLoadingPreview = ref(false)

// Format definitions (all formats)
const allFormats = [
  { 
    id: 'json', 
    name: 'JSON (Native)', 
    description: 'PixlHub native format - supports all annotation types',
    supportedTypes: ['image', 'text', 'rlhf', 'classification', 'sentiment', 'ner', 'emotion'],
    schema: `{
  "version": "1.0",
  "tasks": [{
    "asset": {
      "name": "image1.jpg",
      "url": "https://...",
      "width": 1920,
      "height": 1080
    },
    "annotations": [{
      "type": "bbox",
      "labelName": "person",
      "data": {
        "bbox": { "x": 100, "y": 200, "width": 50, "height": 80 }
      }
    }]
  }]
}`
  },
  { 
    id: 'coco', 
    name: 'COCO JSON', 
    description: 'Common Objects in Context format - bbox, polygon, keypoints',
    supportedTypes: ['image'],
    schema: `{
  "images": [{
    "id": 1,
    "file_name": "image1.jpg",
    "width": 1920,
    "height": 1080
  }],
  "annotations": [{
    "id": 1,
    "image_id": 1,
    "category_id": 1,
    "bbox": [100, 200, 50, 80],
    "area": 4000,
    "segmentation": [[x1,y1,x2,y2,...]]
  }],
  "categories": [{
    "id": 1,
    "name": "person"
  }]
}`
  },
  { 
    id: 'yolo', 
    name: 'YOLO (Darknet)', 
    description: 'Bounding boxes only - normalized coordinates', 
    supportedTypes: ['image'],
    warning: 'Polygons will be converted to bounding boxes',
    schema: `# classes.txt
person
car
dog

# image1.txt (one line per object)
0 0.5 0.5 0.3 0.2
# class_id x_center y_center width height (normalized 0-1)`
  },
  { 
    id: 'yolov8-seg', 
    name: 'YOLOv8 Segmentation', 
    description: 'Supports polygons as normalized coordinates',
    supportedTypes: ['image'],
    schema: `# classes.txt
person
car

# image1.txt (one line per object)
0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8
# class_id x1 y1 x2 y2 x3 y3... (normalized)`
  },
  { 
    id: 'pascal-voc',
    supportedTypes: ['image'], 
    name: 'Pascal VOC (XML)', 
    description: 'XML format - bounding boxes only', 
    warning: 'Polygons will be converted to bounding boxes',
    schema: `<annotation>
  <filename>image1.jpg</filename>
  <size>
    <width>1920</width>
    <height>1080</height>
  </size>
  <object>
    <name>person</name>
    <bndbox>
      <xmin>100</xmin>
      <ymin>200</ymin>
      <xmax>150</xmax>
      <ymax>280</ymax>
    </bndbox>
  </object>
</annotation>`
  },
  { 
    id: 'csv',
    supportedTypes: ['image', 'text', 'rlhf', 'classification', 'sentiment', 'ner', 'emotion'], 
    name: 'CSV (Simple)', 
    description: 'Tabular format - good for classification and simple bbox',
    schema: `filename,label,type,x,y,width,height
image1.jpg,person,bbox,100,200,50,80
image2.jpg,car,bbox,300,400,120,90`
  },
  { 
    id: 'custom', 
    name: 'Custom Template', 
    description: 'Define your own JSON structure with placeholders',
    supportedTypes: ['image', 'text', 'rlhf', 'classification', 'sentiment', 'ner', 'emotion'],
    schema: `{
  "image": "{{asset.name}}",
  "labels": "{{annotations.map(a => a.label.name)}}",
  "boxes": "{{annotations.map(a => a.bbox)}}"
}`
  }
]

// Filter formats based on project type
const formats = computed(() => {
  const projectType = props.project?.toolType || 'image'
  return allFormats.filter(format => 
    format.supportedTypes?.includes(projectType) || !format.supportedTypes
  )
})

const selectedFormatInfo = computed(() => formats.value.find(f => f.id === selectedFormat.value))

// Compatibility warnings
const compatibilityWarnings = computed(() => {
  const warnings: Array<{ type: 'warning' | 'info' | 'error'; message: string }> = []
  const format = selectedFormatInfo.value
  
  if (!format) return warnings
  
  if (format.warning) {
    warnings.push({ type: 'warning', message: format.warning })
  }
  
  return warnings
})

// Load export stats
const loadExportStats = async () => {
  isLoadingStats.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/projects/${props.projectId}/export-stats`)
    if (response.success && response.data) {
      exportStats.value = {
        ...exportStats.value,
        ...response.data
      }
    }
  } catch (error) {
    console.error('Failed to load export stats:', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Load export history
const loadExportHistory = async () => {
  isLoadingHistory.value = true
  try {
    const response = await $fetch(`/api/projects/${props.projectId}/exports`)
    if (response.success) {
      exportHistory.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to load export history:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

// Handle export
const handleExport = async () => {
  if (selectedFormat.value === 'custom' && !validateCustomTemplate()) {
    return
  }

  isExporting.value = true
  
  try {
    // Determine if this is a text project or image project
    const isTextProject = props.project?.toolType && ['text', 'rlhf', 'classification', 'sentiment', 'ner', 'emotion'].includes(props.project.toolType)
    
    const body: any = {
      format: selectedFormat.value,
      includeNonReviewed: exportOptions.value.includeNonReviewed
    }

    // For image projects, include full options
    if (!isTextProject) {
      body.options = exportOptions.value
      
      // Add date range if selected
      if (dateRange.value) {
        body.dateRangeStart = new Date(dateRange.value[0]).toISOString()
        body.dateRangeEnd = new Date(dateRange.value[1]).toISOString()
      }

      // Add custom template if custom format
      if (selectedFormat.value === 'custom') {
        body.customTemplate = JSON.parse(customTemplate.value)
      }
    }

    // Use different endpoints for text vs image projects
    if (isTextProject) {
      // Text projects: direct file download
      const endpoint = `/api/projects/${props.projectId}/export-text`
      const url = `${endpoint}?format=${selectedFormat.value}&includeNonReviewed=${exportOptions.value.includeNonReviewed}`
      
      // Trigger download by opening in new window
      window.open(url, '_blank')
      message.success('Export started - file will download shortly')
    } else {
      // Image projects: use existing export service
      const endpoint = `/api/projects/${props.projectId}/export`
      const response: any = await $fetch(endpoint, {
        method: 'POST',
        body
      })
      
      if (response.success) {
        message.success(`Export completed! Version ${response.data.version}`)
        
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

        // Reload history
        await loadExportHistory()
      }
    }
  } catch (error) {
    console.error('Export failed:', error)
    message.error('Failed to export annotations')
  } finally {
    isExporting.value = false
  }
}

// Download previous export
const downloadExport = async (exportId: string) => {
  try {
    const response = await $fetch(`/api/exports/${exportId}/download`)
    if (response.success && response.data.downloadUrl) {
      const link = document.createElement('a')
      link.href = response.data.downloadUrl
      link.download = response.data.filename || 'export.zip'
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
    customTemplateError.value = 'Template cannot be empty'
    return false
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

// Save custom template
const saveTemplate = () => {
  if (!validateCustomTemplate()) {
    message.error('Please fix template errors before saving')
    return
  }
  
  if (!templateName.value.trim()) {
    message.error('Please enter a template name')
    return
  }
  
  // Check if name already exists
  const existingIndex = savedTemplates.value.findIndex(t => t.name === templateName.value)
  
  if (existingIndex >= 0) {
    // Update existing
    const existing = savedTemplates.value[existingIndex]
    if (existing) {
      existing.template = customTemplate.value
      message.success(`Template "${templateName.value}" updated`)
    }
  } else {
    // Add new
    savedTemplates.value.push({
      name: templateName.value,
      template: customTemplate.value
    })
    message.success(`Template "${templateName.value}" saved`)
  }
  
  // Save to localStorage
  localStorage.setItem(`pixlhub_templates_${props.projectId}`, JSON.stringify(savedTemplates.value))
  templateName.value = ''
}

// Load template
const loadTemplate = (template: string) => {
  customTemplate.value = template
  message.success('Template loaded')
}

// Delete template
const deleteTemplate = (name: string) => {
  savedTemplates.value = savedTemplates.value.filter(t => t.name !== name)
  localStorage.setItem(`pixlhub_templates_${props.projectId}`, JSON.stringify(savedTemplates.value))
  message.success(`Template "${name}" deleted`)
}

// Load saved templates on mount
const loadSavedTemplates = () => {
  const saved = localStorage.getItem(`pixlhub_templates_${props.projectId}`)
  if (saved) {
    try {
      savedTemplates.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load saved templates:', e)
    }
  }
}

// Load live preview
const loadLivePreview = async () => {
  if (previewTab.value !== 'live') return
  
  isLoadingPreview.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/projects/${props.projectId}/export-preview`, {
      method: 'POST',
      body: {
        format: selectedFormat.value,
        options: exportOptions.value,
        limit: 3 // Only preview first 3 items
      }
    })
    
    if (response.success && response.data) {
      livePreview.value = JSON.stringify(response.data, null, 2)
    }
  } catch (error) {
    console.error('Failed to load preview:', error)
    message.error('Failed to load preview')
  } finally {
    isLoadingPreview.value = false
  }
}

// Watch for format changes to reload preview
watch([selectedFormat, previewTab], () => {
  if (previewTab.value === 'live') {
    loadLivePreview()
  }
})

// History table columns
const historyColumns = computed(() => [
  { title: 'Ver', key: 'version', width: 60 },
  { 
    title: 'Format', 
    key: 'format', 
    width: 100,
    render: (row: any) => h(NTag, { size: 'small' }, { default: () => row.format })
  },
  { title: 'Filename', key: 'filename', ellipsis: { tooltip: true } },
  { title: 'Tasks', key: 'taskCount', width: 70 },
  { title: 'Annotations', key: 'annotationCount', width: 100 },
  { 
    title: 'Size', 
    key: 'fileSize', 
    width: 90,
    render: (row: any) => formatFileSize(row.fileSize)
  },
  { 
    title: 'Date', 
    key: 'createdAt', 
    width: 150,
    render: (row: any) => h('span', { class: 'text-xs' }, formatDate(row.createdAt))
  },
  { 
    title: '', 
    key: 'actions', 
    width: 80,
    render: (row: any) => h(NButton, { 
      size: 'tiny',
      onClick: () => downloadExport(row.id)
    }, {
      icon: () => h(NIcon, null, { default: () => h(Download) })
    })
  }
])

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
}

onMounted(() => {
  loadExportStats()
  loadExportHistory()
  loadSavedTemplates()
})
</script>

<template>
  <div>
    <NTabs v-model:value="activeTab" type="line" size="medium">
      <!-- New Export Tab -->
      <NTabPane name="new-export">
        <template #tab>
          <div class="flex items-center gap-2">
            <Download :size="16" />
            <span>New Export</span>
          </div>
        </template>

        <div class="pt-4">
          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-6">
              <!-- Export Summary -->
              <NCard title="Export Summary" size="small">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NStatistic label="Completed" :value="exportStats.completedTasks" />
              <NStatistic label="Labeled" :value="exportStats.labeledTasks" />
              <NStatistic label="Annotations" :value="exportStats.totalAnnotations" />
              <NStatistic label="Ready" :value="exportStats.completedTasks" />
            </div>
            
            <!-- Annotation Types -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Annotation Types:
              </div>
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

            <!-- Label Statistics -->
            <div v-if="Object.keys(exportStats.labelStats).length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Labels Distribution:
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                <div
                  v-for="(count, label) in exportStats.labelStats"
                  :key="label"
                  class="flex justify-between items-center"
                >
                  <span class="truncate mr-2">{{ label }}:</span>
                  <NTag size="tiny" type="info">{{ count }}</NTag>
                </div>
              </div>
            </div>
          </NCard>

          <!-- Date Range Filter -->
          <NCard title="Date Range Filter (Optional)" size="small">
            <div class="flex items-center gap-3">
              <Calendar :size="18" class="text-gray-400" />
              <NDatePicker
                v-model:value="dateRange"
                type="daterange"
                clearable
                placeholder="Select date range"
                class="flex-1"
              />
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Export only tasks completed within this date range
            </p>
          </NCard>

          <!-- Format Selection -->
          <NCard title="Select Export Format" size="small">
            <NList hoverable clickable>
              <NListItem
                v-for="format in formats"
                :key="format.id"
                @click="selectedFormat = format.id as typeof selectedFormat"
                class="cursor-pointer"
              >
                <template #prefix>
                  <NRadio
                    :checked="selectedFormat === format.id"
                    :value="format.id"
                    @click.stop="selectedFormat = format.id as typeof selectedFormat"
                  />
                </template>
                
                <NThing :title="format.name">
                  <template #description>
                    <div class="text-xs">
                      <NTag size="tiny" :type="selectedFormat === format.id ? 'info' : 'default'" class="mr-2">
                        {{ format.id }}
                      </NTag>
                      <span v-if="selectedFormat === format.id" class="text-gray-600 dark:text-gray-400">
                        {{ format.description }}
                      </span>
                    </div>
                  </template>
                </NThing>
                
                <template #suffix>
                  <NIcon v-if="selectedFormat === format.id" :size="16" class="text-blue-500">
                    <ChevronRight />
                  </NIcon>
                </template>
              </NListItem>
            </NList>
          </NCard>

          <!-- Warnings -->
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
            </div>

            <!-- Right Column - Format Preview -->
            <div class="space-y-6">
              <NCard title="Format Preview" size="small">
                <div v-if="selectedFormatInfo" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium text-sm">{{ selectedFormatInfo.name }}</h4>
                    <NTag size="small" type="info">{{ selectedFormat }}</NTag>
                  </div>
                  
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ selectedFormatInfo.description }}
                  </p>

                  <!-- Preview Tabs -->
                  <NTabs v-model:value="previewTab" type="segment" size="small" class="mt-4">
                    <NTabPane name="schema" tab="Schema">
                      <div class="mt-3">
                        <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Example Structure:
                        </div>
                        <pre class="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96"><code>{{ selectedFormatInfo.schema }}</code></pre>
                      </div>
                    </NTabPane>
                    
                    <NTabPane name="live" tab="Live Preview">
                      <div class="mt-3">
                        <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Your Data (First 3 items):</span>
                          <NButton size="tiny" @click="loadLivePreview" :loading="isLoadingPreview">
                            Refresh
                          </NButton>
                        </div>
                        <div v-if="isLoadingPreview" class="text-center py-8">
                          <NProgress type="circle" :percentage="100" :show-indicator="false" />
                        </div>
                        <pre v-else-if="livePreview" class="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96"><code>{{ livePreview }}</code></pre>
                        <div v-else class="text-xs text-gray-500 text-center py-8">
                          Click refresh to load preview
                        </div>
                      </div>
                    </NTabPane>
                  </NTabs>
                </div>
              </NCard>

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

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3">
                <NButton
                  type="primary"
                  size="large"
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
          </div>
        </div>
      </NTabPane>

      <!-- Export History Tab -->
      <NTabPane name="history">
        <template #tab>
          <div class="flex items-center gap-2">
            <History :size="16" />
            <span>Export History</span>
          </div>
        </template>

        <div class="pt-4">
          <NCard size="small">
            <NDataTable
              :columns="historyColumns"
              :data="exportHistory"
              :loading="isLoadingHistory"
              :pagination="{ pageSize: 10 }"
              size="small"
            >
              <template #empty>
                <div class="text-center py-8 text-gray-500">
                  No export history yet
                </div>
              </template>
            </NDataTable>
          </NCard>
        </div>
      </NTabPane>

      <!-- Custom Template Tab -->
      <NTabPane name="custom-template" :disabled="selectedFormat !== 'custom'">
        <template #tab>
          <div class="flex items-center gap-2" :class="[selectedFormat !== 'custom' ? 'opacity-50' : '']">
            <Code2 :size="16" />
            <span>Custom Template</span>
          </div>
        </template>

        <div class="pt-4 space-y-4">
          <!-- Disabled State Message -->
          <NAlert v-if="selectedFormat !== 'custom'" type="info" title="Custom Template Disabled">
            To enable custom template modifications, please select <strong>"Custom Template"</strong> format in the New Export tab.
          </NAlert>

          <NCard title="Custom JSON Template" size="small" :class="[selectedFormat !== 'custom' ? 'opacity-50 pointer-events-none' : '']">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Define your own export structure using placeholders. Available variables:
            </p>
            
            <div class="text-xs space-y-1 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <div><code v-text="'{{asset.name}}'"></code> - Asset filename</div>
              <div><code v-text="'{{asset.url}}'"></code> - Asset URL</div>
              <div><code v-text="'{{asset.width}}'"></code> - Image width</div>
              <div><code v-text="'{{asset.height}}'"></code> - Image height</div>
              <div><code v-text="'{{annotations}}'"></code> - Array of annotations</div>
              <div><code v-text="'{{annotations.map(a => a.label.name)}}'"></code> - Label names</div>
            </div>

            <NInput
              v-model:value="customTemplate"
              type="textarea"
              placeholder="Enter JSON template..."
              :rows="15"
              :status="customTemplateError ? 'error' : undefined"
              @blur="validateCustomTemplate"
            />
            
            <div v-if="customTemplateError" class="text-xs text-red-500 mt-2">
              {{ customTemplateError }}
            </div>

            <!-- Save Template -->
            <div class="mt-4 flex items-center gap-3">
              <NInput
                v-model:value="templateName"
                placeholder="Template name (e.g., 'COCO-like format')"
                class="flex-1"
                size="small"
              />
              <NButton
                type="primary"
                size="small"
                @click="saveTemplate"
                :loading="isSavingTemplate"
                :disabled="!customTemplate.trim()"
              >
                Save Template
              </NButton>
            </div>
          </NCard>

          <!-- Saved Templates -->
          <NCard v-if="savedTemplates.length > 0" title="Saved Templates" size="small" :class="[selectedFormat !== 'custom' ? 'opacity-50 pointer-events-none' : '']">
            <NList hoverable>
              <NListItem
                v-for="template in savedTemplates"
                :key="template.name"
              >
                <NThing :title="template.name">
                  <template #description>
                    <div class="text-xs text-gray-500 truncate max-w-md">
                      {{ template.template.substring(0, 80) }}...
                    </div>
                  </template>
                </NThing>
                
                <template #suffix>
                  <NSpace>
                    <NButton
                      size="tiny"
                      @click="loadTemplate(template.template)"
                    >
                      Load
                    </NButton>
                    <NButton
                      size="tiny"
                      type="error"
                      @click="deleteTemplate(template.name)"
                    >
                      Delete
                    </NButton>
                  </NSpace>
                </template>
              </NListItem>
            </NList>
          </NCard>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>
