<script setup lang="ts">
import { 
  LayoutGrid, 
  Image, 
  ListChecks, 
  Tags, 
  MessageSquare, 
  Download, 
  Settings,
  ArrowLeft,
  Play,
  MoreVertical,
  Upload,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  Check,
  X
} from 'lucide-vue-next'
import { NButton, NCard, NTabs, NTabPane, NTag, NProgress, NStatistic, NSpace, NGrid, NGridItem, NDropdown, NUpload, NUploadDragger, NIcon, NText, useMessage, useDialog, NModal, NDataTable, NEmpty, NButtonGroup, NDivider, NFormItem, NInput, NSelect, NPagination, NCollapse, NCollapseItem, NCheckbox } from 'naive-ui'
import type { UploadFileInfo, DataTableColumns } from 'naive-ui'
import { Grid, List, Plus } from 'lucide-vue-next'
import BulkStatusChangeModal from '~/components/project/BulkStatusChangeModal.vue'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const commentStore = useCommentStore()
const message = useMessage()
const dialog = useDialog()
const projectId = route.params.id as string

// Upload state
const showUploadModal = ref(false)
const fileList = ref<UploadFileInfo[]>([])
const isUploading = ref(false)
const uploadingFiles = ref<Array<{ name: string; status: 'uploading' | 'success' | 'error'; progress: number }>>([])
const batchName = ref('')
const newBatchInput = ref('')
const availableBatches = ref<string[]>([])
const selectedBatch = ref<string | null>(null)

// Bulk status change modal
const showBulkStatusModal = ref(false)

// View mode
const viewMode = ref<'grid' | 'list'>('grid')

// Pagination
const currentPage = ref(1)
const pageSize = ref(24)

// Filtering
const batchFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)
const taskStatusFilter = ref<string | null>(null)
const commentStatusFilter = ref<string | null>(null)

// Task selection for bulk operations
const selectedTasks = ref<Set<string>>(new Set())

// Selection & Bulk Operations
const selectedAssets = ref<Set<string>>(new Set())

const toggleSelection = (taskId: string) => {
  if (selectedAssets.value.has(taskId)) {
    selectedAssets.value.delete(taskId)
  } else {
    selectedAssets.value.add(taskId)
  }
}

const selectAll = () => {
  filteredAssets.value.forEach((asset: any) => {
    selectedAssets.value.add(asset.id)
  })
}

const deselectAll = () => {
  selectedAssets.value.clear()
}

const deleteSelected = async () => {
  if (selectedAssets.value.size === 0) {
    message.warning('No assets selected')
    return
  }
  
  // Show confirmation dialog
  dialog.warning({
    title: 'Delete Assets',
    content: `Are you sure you want to delete ${selectedAssets.value.size} asset(s)? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        // TODO: Implement bulk delete API
        const deletePromises = Array.from(selectedAssets.value).map(id => 
          fetch(`/api/tasks/${id}`, { method: 'DELETE' })
        )
        
        await Promise.all(deletePromises)
        
        message.success(`Deleted ${selectedAssets.value.size} asset(s)`)
        selectedAssets.value.clear()
        
        // Refresh project data
        await projectStore.fetchProjectById(projectId)
      } catch (error) {
        console.error('Delete error:', error)
        message.error('Failed to delete assets')
      }
    }
  })
}

// Get unique batches from assets
const uniqueBatches = computed(() => {
  if (!project.value?.assets) return []
  const batches = new Set<string>()
  project.value.assets.forEach((asset: any) => {
    if (asset.metadata?.batchName) {
      batches.add(asset.metadata.batchName)
    }
  })
  return Array.from(batches)
})

// Filtered assets
const filteredAssets = computed(() => {
  console.log('🔍 Filtering assets:', {
    projectAssets: project.value?.assets?.length,
    batchFilter: batchFilter.value,
    statusFilter: statusFilter.value
  })
  
  if (!project.value?.assets) {
    console.log('⚠️ No assets found in project')
    return []
  }
  
  const filtered = project.value.assets.filter((asset: any) => {
    // Batch filter
    if (batchFilter.value && asset.metadata?.batchName !== batchFilter.value) {
      return false
    }
    
    // Status filter - check the latest task status
    if (statusFilter.value) {
      const latestTask = asset.tasks?.[0]
      if (!latestTask || latestTask.status !== statusFilter.value) {
        return false
      }
    }
    
    return true
  })
  
  console.log('✅ Filtered assets:', filtered.length)
  return filtered
})

// Paginated assets for grid view
const paginatedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAssets.value.slice(start, end)
})

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredAssets.value.length / pageSize.value)
})

// Reset to page 1 when filters change
watch([batchFilter, statusFilter], () => {
  currentPage.value = 1
})

// Task stats
const taskStats = computed(() => {
  if (!project.value?.tasks) {
    return { label: 0, review: 0, completed: 0, total: 0 }
  }
  
  const stats = {
    label: 0,
    review: 0,
    completed: 0,
    total: project.value.tasks.length
  }
  
  project.value.tasks.forEach((task: any) => {
    if (task.status === 'label') stats.label++
    else if (task.status === 'review') stats.review++
    else if (task.status === 'completed') stats.completed++
  })
  
  return stats
})

// Filtered task list for Tasks tab
const filteredTaskList = computed(() => {
  if (!project.value?.tasks) return []
  
  if (!taskStatusFilter.value) return project.value.tasks
  
  return project.value.tasks.filter((task: any) => task.status === taskStatusFilter.value)
})

console.log('Project Detail Page Loaded - ID:', projectId)

const activeTab = ref('overview')

// Tabs - conditionally show label schema based on annotation type
const tabs = computed(() => {
  const baseTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'assets', label: 'Assets', icon: Image },
    { id: 'tasks', label: 'Tasks', icon: ListChecks }
  ]
  
  // Only show label schema for non-sentiment projects
  // Sentiment uses predefined labels (Positive, Negative, Neutral)
  if (project.value?.annotationType !== 'sentiment') {
    baseTabs.push({ id: 'labels', label: 'Label Schema', icon: Tags })
  }
  
  baseTabs.push(
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings }
  )
  
  return baseTabs
})

// Load project from store
const project = computed(() => {
  return projectStore.projects.find(p => p.id === projectId)
})

// Calculate real-time stats from actual task statuses
const projectStats = computed(() => {
  if (!project.value?.tasks) {
    return {
      totalTasks: project.value?.totalTasks || 0,
      completedTasks: project.value?.completedTasks || 0,
      labelTasks: 0,
      reviewTasks: 0,
      progress: 0
    }
  }

  const tasks = project.value.tasks
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
  const labelTasks = tasks.filter((t: any) => t.status === 'label').length
  const reviewTasks = tasks.filter((t: any) => t.status === 'review').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    totalTasks,
    completedTasks,
    labelTasks,
    reviewTasks,
    progress
  }
})

// Fetch project with tasks
onMounted(async () => {
  // Always fetch the specific project to ensure we have tasks
  await projectStore.fetchProjectById(projectId)
})

const goToAnnotate = async () => {
  try {
    // Get next available task from label queue
    const response = await fetch(`/api/tasks/next?projectId=${projectId}&status=label`)
    const result = await response.json()
    
    if (result.success && result.data) {
      // Navigate to annotation page with task ID
      router.push(`/annotate?project=${projectId}&task=${result.data.id}`)
    } else {
      message.warning('No tasks available in the label queue')
    }
  } catch (error) {
    console.error('Error getting next task:', error)
    message.error('Failed to get next task')
  }
}

// Handle file upload
const handleFileChange = (options: { fileList: UploadFileInfo[] }) => {
  fileList.value = options.fileList
}

// Get accepted file types based on project tool type
const getAcceptedFileTypes = () => {
  if (!project.value) return 'image/*'
  
  const acceptMap: Record<string, string> = {
    image: '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff',
    text: '.txt,.csv,.tsv,.md',
    audio: '.mp3,.wav,.ogg,.m4a,.flac,.aac',
    video: '.mp4,.mov,.avi,.webm,.mkv',
    document: '.pdf,.doc,.docx,.odt',
    rlhf: '.json,.jsonl',
    classification: '.txt,.csv,.json',
    sentiment: '.txt,.csv,.json',
    ner: '.txt,.csv,.json'
  }
  
  return acceptMap[project.value.toolType] || 'image/*'
}

// Get supported file types text for display
const getSupportedFileTypesText = () => {
  if (!project.value) return 'Supported: JPG, PNG, GIF, WebP'
  
  const textMap: Record<string, string> = {
    image: 'Supported: JPG, PNG, GIF, WebP, SVG',
    text: 'Supported: TXT, CSV, TSV, MD',
    audio: 'Supported: MP3, WAV, OGG, M4A',
    video: 'Supported: MP4, MOV, AVI, WebM',
    document: 'Supported: PDF, DOC, DOCX',
    rlhf: 'Supported: JSON, JSONL',
    classification: 'Supported: TXT, CSV, JSON',
    sentiment: 'Supported: TXT, CSV, JSON',
    ner: 'Supported: TXT, CSV, JSON'
  }
  
  return textMap[project.value.toolType] || 'Supported: JPG, PNG, GIF, WebP'
}

// Export options - dynamically based on project type
const exportOptions = computed(() => {
  const toolType = project.value?.toolType
  
  // Common formats for all types
  const common = [
    {
      label: 'JSON (Native Format)',
      key: 'json',
      props: {
        onClick: () => handleExport('json')
      }
    },
    {
      label: 'CSV (Spreadsheet)',
      key: 'csv',
      props: {
        onClick: () => handleExport('csv')
      }
    }
  ]
  
  // Image-specific formats
  if (toolType === 'image') {
    return [
      ...common,
      {
        label: 'COCO JSON (Object Detection)',
        key: 'coco',
        props: {
          onClick: () => handleExport('coco')
        }
      },
      {
        label: 'YOLO (Darknet)',
        key: 'yolo',
        props: {
          onClick: () => handleExport('yolo')
        }
      },
      {
        label: 'YOLOv8 Segmentation',
        key: 'yolov8-seg',
        props: {
          onClick: () => handleExport('yolov8-seg')
        }
      },
      {
        label: 'Pascal VOC (XML)',
        key: 'pascal-voc',
        props: {
          onClick: () => handleExport('pascal-voc')
        }
      }
    ]
  }
  
  // Text-specific formats (NER, sentiment, etc.)
  if (toolType === 'text') {
    return [
      ...common,
      {
        label: 'JSONL (Line-delimited)',
        key: 'jsonl',
        props: {
          onClick: () => handleExport('jsonl')
        }
      }
    ]
  }
  
  // Default: just common formats
  return common
})

// Handle export - use POST endpoint with proper options
const handleExport = async (format: string) => {
  try {
    message.info(`Preparing ${format.toUpperCase()} export...`)
    
    // Call POST endpoint with format and default options
    const response = await $fetch(`/api/projects/${projectId}/export`, {
      method: 'POST',
      body: {
        format,
        options: {
          includeMetadata: true,
          includeNonReviewed: false,
          includeReviewMetadata: false,
          splitDataset: false,
          trainSplit: 80,
          valSplit: 10,
          testSplit: 10
        }
      }
    })
    
    if (response.success && response.data?.downloadUrl) {
      // Open download URL
      window.open(response.data.downloadUrl, '_blank')
      const data = response.data as any
      const taskInfo = data.taskCount ? ` (${data.taskCount} tasks, ${data.annotationCount} annotations)` : ''
      message.success(`Export ready!${taskInfo}`)
    } else {
      throw new Error('Export failed')
    }
  } catch (error) {
    console.error('Export error:', error)
    message.error('Failed to export annotations')
  }
}

// Add new batch
const addBatch = () => {
  if (!newBatchInput.value.trim()) {
    message.warning('Please enter a batch name')
    return
  }
  
  if (availableBatches.value.includes(newBatchInput.value)) {
    message.warning('Batch already exists')
    return
  }
  
  availableBatches.value.push(newBatchInput.value)
  selectedBatch.value = newBatchInput.value
  batchName.value = newBatchInput.value
  newBatchInput.value = ''
  message.success('Batch created and selected')
}

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    message.warning('Please select files to upload')
    return
  }

  // No file count limit - removed for testing with large datasets
  console.log(`📦 Uploading ${fileList.value.length} files...`)

  // Validate total size (10GB limit for testing)
  const totalSize = fileList.value.reduce((sum, f) => sum + (f.file?.size || 0), 0)
  const maxSize = 10 * 1024 * 1024 * 1024 // 10GB (increased for large dataset testing)
  if (totalSize > maxSize) {
    message.error(`Total size exceeds 10GB limit (${(totalSize / 1024 / 1024 / 1024).toFixed(2)}GB)`)
    return
  }

  isUploading.value = true
  
  // Initialize upload status for each file
  uploadingFiles.value = fileList.value.map(f => ({
    name: f.name,
    status: 'uploading' as const,
    progress: 0
  }))

  // Simulate progress for better UX
  const progressInterval = setInterval(() => {
    uploadingFiles.value.forEach(f => {
      if (f.status === 'uploading' && f.progress < 90) {
        f.progress += Math.random() * 15
        if (f.progress > 90) f.progress = 90
      }
    })
  }, 300)

  try {
    const formData = new FormData()
    formData.append('projectId', projectId)
    if (batchName.value) {
      formData.append('batchName', batchName.value)
    }

    fileList.value.forEach((file) => {
      if (file.file) {
        formData.append('files', file.file)
      }
    })

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    
    // Mark all as success
    uploadingFiles.value.forEach(f => {
      f.status = 'success'
      f.progress = 100
    })
    
    // Show message with rename info if any
    if (result.renamed && result.renamed.length > 0) {
      message.info(result.message || 'Files uploaded successfully')
      console.log('📝 Renamed files:', result.renamed)
    } else {
      message.success(result.message || 'Files uploaded successfully')
    }
    
    // Refresh project data
    await projectStore.fetchProjectById(projectId)
    
    // Clear after delay
    setTimeout(() => {
      fileList.value = []
      uploadingFiles.value = []
      batchName.value = ''
      showUploadModal.value = false
    }, 1500)
  } catch (error) {
    clearInterval(progressInterval)
    console.error('Upload error:', error)
    uploadingFiles.value.forEach(f => f.status = 'error')
    message.error('Failed to upload files')
  } finally {
    isUploading.value = false
  }
}

// Table columns for list view
const assetColumns = computed<DataTableColumns>(() => {
  const columns: any[] = []
  
  // Always show checkbox column
  columns.push({
    type: 'selection',
    width: 50
  })
  
  // Asset column
  columns.push({
    title: 'Asset',
    key: 'asset',
    width: 200,
    render: (row: any) => h('div', { class: 'flex items-center gap-3 py-1' }, [
      h('img', {
        src: row.url,
        class: 'w-14 h-14 object-cover rounded',
        alt: row.name
      })
    ])
  })
  
  // Other columns
  columns.push(
    {
      title: 'External ID',
      key: 'externalId',
      render: (row: any) => h('span', { class: 'text-sm' }, row.name)
    },
    {
      title: 'Created At',
      key: 'createdAt',
      width: 150,
      render: (row: any) => {
        const date = new Date(row.createdAt)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        
        let timeAgo = ''
        if (diffDays > 0) {
          timeAgo = `${diffDays}d ${diffHours % 24}h ago`
        } else if (diffHours > 0) {
          timeAgo = `${diffHours}h ago`
        } else {
          timeAgo = 'Just now'
        }
        
        return h('span', { class: 'text-sm text-gray-600 dark:text-gray-400' }, timeAgo)
      }
    },
    {
      title: 'Batches',
      key: 'batches',
      width: 150,
      render: (row: any) => row.metadata?.batchName 
        ? h(NTag, { 
            type: 'warning', 
            size: 'small',
            style: { backgroundColor: '#FEF3C7', color: '#92400E', border: 'none' }
          }, { default: () => row.metadata.batchName })
        : h('span', { class: 'text-gray-400 text-xs' }, '-')
    },
    {
      title: 'Tasks',
      key: 'tasks',
      width: 100,
      render: (row: any) => h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center' }, [
          h('span', { class: 'text-xs font-medium text-blue-600 dark:text-blue-300' }, '0')
        ])
      ])
    }
  )
  
  return columns
})

// Task table columns
const taskTableColumns = computed(() => {
  const columns: any[] = []
  
  // Always show checkbox column
  columns.push({
    type: 'selection',
    width: 50
  })
  
  columns.push(
    {
      title: 'Asset',
      key: 'asset',
      width: 200,
      render: (row: any) => h('div', { class: 'flex items-center gap-3' }, [
        row.asset ? h('img', {
          src: row.asset.url,
          class: 'w-12 h-12 object-cover rounded',
          alt: row.asset.name
        }) : h('div', { class: 'w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded' })
      ])
    },
  {
    title: 'Asset Name',
    key: 'assetName',
    render: (row: any) => h('span', { class: 'text-sm' }, row.asset?.name || 'N/A')
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: (row: any) => {
      const statusColors: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
        label: 'info',
        review: 'warning',
        completed: 'success'
      }
      return h(NTag, {
        type: (statusColors[row.status] || 'default') as 'info' | 'warning' | 'success' | 'default',
        size: 'small'
      }, { default: () => row.status })
    }
  },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      width: 150,
      render: (row: any) => h('span', { class: 'text-sm' }, row.assignedTo || 'Unassigned')
    },
    {
      title: 'Priority',
      key: 'priority',
      width: 100,
      render: (row: any) => h('span', { class: 'text-sm' }, row.priority || 0)
    },
    {
      title: 'Queued At',
      key: 'queuedAt',
      width: 180,
      render: (row: any) => h('span', { class: 'text-sm text-gray-600 dark:text-gray-400' }, 
        new Date(row.queuedAt || row.createdAt).toLocaleString()
      )
    }
  )
  
  return columns
})

const goBack = () => {
  router.push('/projects')
}

// Handle task click - navigate to annotation tool or review page
const handleTaskClick = (task: any) => {
  if (task.status === 'review') {
    router.push(`/review?project=${projectId}&task=${task.id}`)
  } else {
    router.push(`/annotate?project=${projectId}&task=${task.id}`)
  }
}

// Task selection functions
// Modern selection state
const isAllSelected = computed(() => {
  return filteredTaskList.value.length > 0 && 
         selectedTasks.value.size === filteredTaskList.value.length
})

const isSomeSelected = computed(() => {
  return selectedTasks.value.size > 0 && 
         selectedTasks.value.size < filteredTaskList.value.length
})

// Toggle select all (modern pattern)
const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    // Select all visible tasks
    filteredTaskList.value.forEach((task: any) => {
      selectedTasks.value.add(task.id)
    })
  } else {
    // Deselect all
    selectedTasks.value.clear()
  }
}

const selectAllTasks = () => {
  filteredTaskList.value.forEach((task: any) => {
    selectedTasks.value.add(task.id)
  })
}

const deselectAllTasks = () => {
  selectedTasks.value.clear()
}

// Open bulk status change modal
const openBulkStatusModal = () => {
  if (selectedTasks.value.size === 0) {
    message.warning('No tasks selected')
    return
  }
  showBulkStatusModal.value = true
}

// Handle successful bulk status change
const handleBulkStatusSuccess = async () => {
  // Refresh project data
  await projectStore.fetchProjectById(projectId)
  
  // Clear selection
  selectedTasks.value.clear()
}

// Legacy function - kept for compatibility
const bulkUpdateTaskStatus = async (newStatus: string) => {
  if (selectedTasks.value.size === 0) {
    message.warning('No tasks selected')
    return
  }

  try {
    const taskIds = Array.from(selectedTasks.value)
    
    // Update each task status
    await Promise.all(
      taskIds.map(taskId =>
        fetch(`/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      )
    )

    message.success(`Updated ${taskIds.length} task(s) to ${newStatus}`)
    
    // Refresh project data
    await projectStore.fetchProjectById(projectId)
    
    // Clear selection
    selectedTasks.value.clear()
  } catch (error) {
    console.error('Error updating task status:', error)
    message.error('Failed to update task status')
  }
}

// Comments functionality
const filteredProjectComments = computed(() => {
  let comments = commentStore.comments
  
  if (commentStatusFilter.value === 'resolved') {
    comments = comments.filter(c => c.resolved)
  } else if (commentStatusFilter.value === 'unresolved') {
    comments = comments.filter(c => !c.resolved)
  }
  
  // Sort by creation date (newest first)
  return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const getTaskName = (taskId: string) => {
  const task = project.value?.tasks?.find((t: any) => t.id === taskId)
  return task?.asset?.name || `Task ${taskId.slice(0, 8)}`
}

const navigateToComment = (comment: any) => {
  router.push(`/annotate?project=${projectId}&task=${comment.taskId}`)
}

// Batch helper
const getBatchAssetCount = (batchName: string) => {
  return project.value?.assets?.filter((a: any) => a.metadata?.batchName === batchName).length || 0
}

// Settings sections state
const expandedSections = ref<Set<string>>(new Set(['general']))
const showGuidelinesPdf = ref(false)

const toggleSection = (section: string) => {
  if (expandedSections.value.has(section)) {
    expandedSections.value.delete(section)
  } else {
    expandedSections.value.add(section)
  }
}

// Handle guidelines PDF upload
const handleGuidelineUpload = async (options: { fileList: UploadFileInfo[] }) => {
  const file = options.fileList[0]
  if (!file || !file.file) return

  try {
    const formData = new FormData()
    formData.append('file', file.file)
    formData.append('projectId', projectId)

    message.loading('Uploading guidelines PDF...')

    const response = await $fetch<{ success: boolean; url: string }>('/api/projects/guidelines/upload', {
      method: 'POST' as any,
      body: formData
    })

    if (response.success) {
      message.success('Guidelines PDF uploaded successfully')
      // Refresh project data
      await projectStore.fetchProjectById(projectId)
    }
  } catch (error) {
    console.error('Error uploading guidelines:', error)
    message.error('Failed to upload guidelines PDF')
  }
}

// Delete project
const handleDeleteProject = async () => {
  dialog.error({
    title: 'Delete Project',
    content: `Are you sure you want to permanently delete "${project.value?.name}"? This will delete all assets, thumbnails, annotations, comments, and tasks. This action cannot be undone.`,
    positiveText: 'Delete Forever',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        const response = await $fetch<{ success: boolean; message: string }>(`/api/projects/${projectId}`, {
          method: 'DELETE' as any
        })
        
        if (response.success) {
          message.success('Project deleted successfully')
          router.push('/projects')
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        message.error('Failed to delete project')
      }
    }
  })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    
    <div v-if="!project" class="flex-1 flex items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">Loading project...</p>
    </div>
    
    <div v-else class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      <!-- Back Button & Project Header -->
      <div class="mb-6">
        <NButton text @click="goBack" size="small">
          <template #icon>
            <ArrowLeft :size="14" />
          </template>
          Back to Projects
        </NButton>
        
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ project.name }}
              </h1>
              <NTag
                :type="project.status === 'active' ? 'success' : 'default'"
                size="small"
              >
                {{ project.status }}
              </NTag>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ project.description }}
            </p>
          </div>
          
          <NSpace>
            <NButton 
              type="warning" 
              @click="router.push(`/review?project=${projectId}`)" 
              size="small"
              :disabled="taskStats.review === 0"
            >
              <template #icon>
                <Play :size="14" />
              </template>
              Start Reviewing ({{ taskStats.review }})
            </NButton>
            <NButton type="primary" @click="goToAnnotate" size="small">
              <template #icon>
                <Play :size="14" />
              </template>
              Start Labeling
            </NButton>
            <NButton circle quaternary size="small">
              <template #icon>
                <MoreVertical :size="16" />
              </template>
            </NButton>
          </NSpace>
        </div>
      </div>

      <!-- Tabs -->
      <NTabs v-model:value="activeTab" type="line" size="small" animated>
        <NTabPane
          v-for="tab in tabs"
          :key="tab.id"
          :name="tab.id"
          :tab="tab.label"
        >
          <template #tab>
            <div class="flex items-center gap-2">
              <component :is="tab.icon" :size="14" />
              {{ tab.label }}
            </div>
          </template>
        </NTabPane>
      </NTabs>

      <!-- Tab Content -->
      <div class="pb-8 mt-4">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <NCard size="small">
              <NStatistic label="Tool Type" :value="project.toolType" class="capitalize" />
            </NCard>
            <NCard size="small">
              <NStatistic label="Total Tasks" :value="projectStats.totalTasks" />
            </NCard>
            <NCard size="small">
              <NStatistic label="Completed" :value="projectStats.completedTasks" />
            </NCard>
            <NCard size="small">
              <NStatistic 
                label="Progress" 
                :value="projectStats.progress" 
                suffix="%"
              />
            </NCard>
          </div>

          <!-- Two Column Layout for Progress and Project Info -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <!-- Progress Bar -->
            <NCard title="Overall Progress" size="small">
              <NProgress
                type="line"
                :percentage="projectStats.progress"
                :height="12"
                indicator-placement="inside"
              />
              <div class="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span>{{ projectStats.completedTasks }} completed</span>
                <span>{{ projectStats.totalTasks - projectStats.completedTasks }} remaining</span>
              </div>
            </NCard>

            <!-- Project Info -->
            <NCard title="Project Information" size="small">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Annotation Type</p>
                  <p class="text-sm text-gray-900 dark:text-gray-100 capitalize">{{ project.annotationType }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p class="text-sm text-gray-900 dark:text-gray-100">{{ project.createdAt }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                  <p class="text-sm text-gray-900 dark:text-gray-100">{{ project.updatedAt }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Project ID</p>
                  <p class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ project.id }}</p>
                </div>
              </div>
            </NCard>
          </div>

          <!-- Detailed Statistics -->
          <project-overview-stats :project-id="projectId" class="mt-4" />
        </div>

        <!-- Assets Tab -->
        <div v-if="activeTab === 'assets'">
          <!-- Header with Add Data button and view toggle -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <!-- Upload Button -->
              <NButton
                type="primary"
                @click="showUploadModal = true"
              >
                <template #icon>
                  <Upload :size="16" />
                </template>
                Upload
              </NButton>

              <!-- Export Button -->
              <NDropdown
                trigger="click"
                :options="exportOptions"
                @select="handleExport"
              >
                <NButton>
                  <template #icon>
                    <Download :size="16" />
                  </template>
                  Export
                </NButton>
              </NDropdown>
              
              <!-- Bulk Actions Bar (when assets selected) -->
              <template v-if="selectedAssets.size > 0">
                <NSpace :size="8">
                  <NText class="text-sm">{{ selectedAssets.size }} selected</NText>
                  <NButton size="small" @click="selectAll">Select All</NButton>
                  <NButton size="small" @click="deselectAll">Deselect All</NButton>
                  <NButton size="small" type="error" @click="deleteSelected">
                    Delete Selected
                  </NButton>
                </NSpace>
              </template>
              
              <!-- Filters -->
              <NSpace :size="8">
                
                <!-- Batch Filter -->
                <NSelect
                  v-model:value="batchFilter"
                  placeholder="Filter by Batch"
                  :options="uniqueBatches.map(b => ({ label: b, value: b }))"
                  style="width: 150px"
                  size="small"
                  clearable
                />
                
                <!-- Status Filter -->
                <NSelect
                  v-model:value="statusFilter"
                  placeholder="Filter by Status"
                  :options="[
                    { label: 'Pending', value: 'pending' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' }
                  ]"
                  style="width: 150px"
                  size="small"
                  clearable
                />
              </NSpace>
            </div>
            
            <NButtonGroup>
              <NButton :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'">
                <template #icon>
                  <NIcon><Grid :size="16" /></NIcon>
                </template>
              </NButton>
              <NButton :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
                <template #icon>
                  <NIcon><List :size="16" /></NIcon>
                </template>
              </NButton>
            </NButtonGroup>
          </div>

          <!-- Grid View -->
          <NCard v-if="viewMode === 'grid'" size="small">
            <div v-if="filteredAssets.length > 0">
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                <div
                  v-for="asset in paginatedAssets"
                  :key="asset.id"
                  class="aspect-square rounded overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 cursor-pointer transition-all group relative bg-gray-100 dark:bg-gray-800"
                >
                  <img
                    :src="asset.metadata?.thumbnailUrl || asset.url"
                    :alt="asset.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  <!-- Batch Badge -->
                  <div v-if="asset.metadata?.batchName" class="absolute top-2 left-2">
                    <NTag size="small" type="info">
                      {{ asset.metadata.batchName }}
                    </NTag>
                  </div>
                  
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-2">
                    <span class="text-white text-xs opacity-0 group-hover:opacity-100 truncate">{{ asset.name }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Pagination -->
              <div class="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <NPagination
                  v-model:page="currentPage"
                  :page-count="totalPages"
                  :page-size="pageSize"
                  show-size-picker
                  :page-sizes="[12, 24, 48, 96]"
                  @update:page-size="(size) => { pageSize = size; currentPage = 1 }"
                />
              </div>
            </div>
            
            <NEmpty v-else description="No assets uploaded yet" class="py-12">
              <template #extra>
                <NButton size="small" @click="showUploadModal = true">Upload Assets</NButton>
              </template>
            </NEmpty>
          </NCard>

          <!-- List View -->
          <NCard v-if="viewMode === 'list'" size="small">
            <NDataTable
              v-if="filteredAssets.length > 0"
              :columns="assetColumns"
              :data="filteredAssets"
              :pagination="{ pageSize: 20 }"
              :bordered="false"
              :row-key="(row: any) => row.id"
              :checked-row-keys="Array.from(selectedAssets)"
              @update:checked-row-keys="(keys: any) => selectedAssets = new Set(keys as string[])"
            />
            
            <NEmpty v-else description="No assets uploaded yet" class="py-12">
              <template #extra>
                <NButton size="small" @click="showUploadModal = true">Upload Assets</NButton>
              </template>
            </NEmpty>
          </NCard>

          <!-- Upload Modal -->
          <NModal
            v-model:show="showUploadModal"
            preset="card"
            title="Upload Data"
            style="width: 1000px; max-width: 95vw"
            :bordered="false"
            :segmented="{ content: true }"
          >
            <div class="flex gap-0 overflow-hidden">
              <!-- Left Sidebar: Controls -->
              <div class="w-64 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                <NSpace vertical :size="24">
                  <!-- File Count -->
                  <div>
                    <NText depth="3" class="text-xs block mb-1">Files Ready</NText>
                    <NText class="text-2xl font-semibold block">
                      {{ fileList.length }}
                    </NText>
                  </div>

                  <!-- Total Size -->
                  <div>
                    <NText depth="3" class="text-xs block mb-1">Total Size</NText>
                    <NText class="text-lg font-medium block">
                      {{ (fileList.reduce((sum, f) => sum + (f.file?.size || 0), 0) / 1024 / 1024).toFixed(2) }} MB
                    </NText>
                  </div>

                  <!-- Batch Selector -->
                  <div>
                    <NText depth="3" class="text-xs block mb-2">Batch</NText>
                    
                    <!-- Selected Batch Display -->
                    <div v-if="selectedBatch" class="mb-2">
                      <NTag closable @close="selectedBatch = null; batchName = ''" type="info">
                        {{ selectedBatch }}
                      </NTag>
                    </div>
                    
                    <!-- Create New Batch -->
                    <NSpace :size="4" vertical>
                      <NInput
                        v-model:value="newBatchInput"
                        placeholder="Enter batch name"
                        size="small"
                        @keydown.enter="addBatch"
                      >
                        <template #suffix>
                          <NButton
                            text
                            size="tiny"
                            @click="addBatch"
                            :disabled="!newBatchInput.trim()"
                          >
                            <template #icon>
                              <NIcon><Plus /></NIcon>
                            </template>
                          </NButton>
                        </template>
                      </NInput>
                      
                      <!-- Available Batches -->
                      <div v-if="availableBatches.length > 0" class="flex flex-wrap gap-1 mt-2">
                        <NTag
                          v-for="batch in availableBatches"
                          :key="batch"
                          :type="selectedBatch === batch ? 'primary' : 'default'"
                          size="small"
                          class="cursor-pointer"
                          @click="selectedBatch = batch; batchName = batch"
                        >
                          {{ batch }}
                        </NTag>
                      </div>
                    </NSpace>
                  </div>

                  <!-- Actions -->
                  <NDivider />
                  
                  <NButton
                    block
                    size="small"
                    @click="fileList = []"
                    :disabled="fileList.length === 0"
                  >
                    Clear Files
                  </NButton>

                  <!-- Upload Info -->
                  <NDivider />
                  
                  <NSpace vertical :size="4">
                    <NText depth="3" class="text-xs">Max file size: 512MB</NText>
                    <NText depth="3" class="text-xs">{{ getSupportedFileTypesText() }}</NText>
                  </NSpace>
                </NSpace>
              </div>

              <!-- Right Area: Upload Zone & File List -->
              <div class="flex-1 p-6 overflow-y-auto">
                <!-- Always show upload component, but hide dragger when files exist -->
                <NUpload
                  multiple
                  directory-dnd
                  :file-list="fileList"
                  @change="handleFileChange"
                  :default-upload="false"
                  :accept="getAcceptedFileTypes()"
                  :show-file-list="false"
                >
                  <!-- Upload Dragger (only when empty) -->
                  <NUploadDragger v-if="fileList.length === 0 && uploadingFiles.length === 0">
                    <div class="py-20">
                      <div class="flex justify-center mb-4">
                        <NIcon :size="64" :depth="3" color="#2563EB">
                          <Upload />
                        </NIcon>
                      </div>
                      <NText class="text-lg font-medium block mb-2">
                        Drag & drop files here or click to browse
                      </NText>
                      <NText depth="3" class="text-sm">
                        jpg, jpeg, png, gif, webp, svg, tiff, dcm, wav, mp3, mp4, mov, avi, dcm, nii, gz
                      </NText>
                      <div class="mt-4 text-xs text-gray-400">
                        512MB maximum upload size
                      </div>
                    </div>
                  </NUploadDragger>

                  <!-- File List Header (when files selected) -->
                  <div v-if="fileList.length > 0 || uploadingFiles.length > 0">
                    <div class="flex items-center justify-between mb-3">
                      <NText class="text-sm font-medium">
                        {{ uploadingFiles.length > 0 ? 'Upload Status' : `${fileList.length} files ready to upload` }}
                      </NText>
                      <NButton
                        text
                        size="small"
                        v-if="uploadingFiles.length === 0"
                      >
                        <template #icon>
                          <NIcon><Plus /></NIcon>
                        </template>
                        Add more files
                      </NButton>
                    </div>
                  </div>
                </NUpload>

                <!-- File List Display -->
                <div v-if="fileList.length > 0 || uploadingFiles.length > 0" class="max-h-[450px] overflow-y-auto">
                  <!-- During Upload: Show Status with Progress -->
                  <div v-if="uploadingFiles.length > 0">
                    <div
                      v-for="(file, index) in uploadingFiles"
                      :key="index"
                      class="relative border-b border-gray-200 dark:border-gray-700 last:border-0 overflow-hidden"
                    >
                      <!-- Progress Background -->
                      <div 
                        class="absolute inset-0 transition-all duration-300 ease-out"
                        :class="[
                          file.status === 'success' ? 'bg-green-100 dark:bg-green-900/20' : 
                          file.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' : 
                          'bg-blue-100 dark:bg-blue-900/20'
                        ]"
                        :style="{ width: `${file.progress}%` }"
                      ></div>
                      
                      <!-- Content (on top of progress) -->
                      <div class="relative flex items-center gap-2.5 px-3 py-2">
                        <NIcon 
                          :size="16" 
                          class="flex-shrink-0"
                          :class="[
                            file.status === 'success' ? 'text-green-600 dark:text-green-400' : 
                            file.status === 'error' ? 'text-red-600 dark:text-red-400' : 
                            'text-blue-600 dark:text-blue-400'
                          ]"
                        >
                          <Check v-if="file.status === 'success'" />
                          <X v-else-if="file.status === 'error'" />
                          <ImageIcon v-else />
                        </NIcon>
                        <span class="text-xs flex-1 truncate font-medium">{{ file.name }}</span>
                        <span class="text-xs font-semibold flex-shrink-0 min-w-[40px] text-right"
                          :class="[
                            file.status === 'success' ? 'text-green-600 dark:text-green-400' : 
                            file.status === 'error' ? 'text-red-600 dark:text-red-400' : 
                            'text-blue-600 dark:text-blue-400'
                          ]"
                        >
                          {{ file.progress }}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Before Upload: Show File List -->
                  <div v-else>
                    <div
                      v-for="(file, index) in fileList"
                      :key="index"
                      class="flex items-center gap-2.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <NIcon :size="16" class="text-blue-500 flex-shrink-0">
                        <ImageIcon />
                      </NIcon>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs truncate">{{ file.name }}</div>
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {{ ((file.file?.size || 0) / 1024).toFixed(0) }} KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <NButton @click="showUploadModal = false" :disabled="isUploading">
                  Cancel
                </NButton>
                <NButton
                  type="primary"
                  @click="handleUpload"
                  :disabled="fileList.length === 0"
                  :loading="isUploading"
                >
                  <template #icon>
                    <NIcon><Upload /></NIcon>
                  </template>
                  Upload {{ fileList.length > 0 ? `${fileList.length} File(s)` : '' }}
                </NButton>
              </div>
            </template>
          </NModal>
        </div>

        <!-- Tasks Tab -->
        <div v-if="activeTab === 'tasks'">
          <!-- Task Queue Stats -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <NCard size="small">
              <NStatistic label="Label Queue" :value="taskStats.label">
                <template #prefix>
                  <NIcon color="#3B82F6"><ListChecks /></NIcon>
                </template>
              </NStatistic>
            </NCard>
            <NCard size="small">
              <NStatistic label="Review Queue" :value="taskStats.review">
                <template #prefix>
                  <NIcon color="#F59E0B"><MessageSquare /></NIcon>
                </template>
              </NStatistic>
            </NCard>
            <NCard size="small">
              <NStatistic label="Completed" :value="taskStats.completed">
                <template #prefix>
                  <NIcon color="#10B981"><Download /></NIcon>
                </template>
              </NStatistic>
            </NCard>
            <NCard size="small">
              <NStatistic label="Total Tasks" :value="taskStats.total">
                <template #prefix>
                  <NIcon color="#6366F1"><Tags /></NIcon>
                </template>
              </NStatistic>
            </NCard>
          </div>

          <!-- Task List -->
          <NCard size="small">
            <template #header>
              <div class="flex items-center justify-between">
                <span>Task Queue</span>
                <NSelect
                  v-model:value="taskStatusFilter"
                  placeholder="All Statuses"
                  :options="[
                    { label: 'Label', value: 'label' },
                    { label: 'Review', value: 'review' },
                    { label: 'Completed', value: 'completed' }
                  ]"
                  style="width: 140px"
                  size="small"
                  clearable
                />
              </div>
            </template>

            <!-- Modern Selection Bar (Always Visible) -->
            <div class="mb-4 flex items-center justify-between gap-4">
              <!-- Left: Selection Controls -->
              <div class="flex items-center gap-3">
                <NCheckbox
                  :checked="isAllSelected"
                  :indeterminate="isSomeSelected && !isAllSelected"
                  @update:checked="toggleSelectAll"
                >
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ selectedTasks.size > 0 ? `${selectedTasks.size} selected` : 'Select all' }}
                  </span>
                </NCheckbox>
              </div>

              <!-- Right: Bulk Actions (Only show when tasks selected) -->
              <NSpace v-if="selectedTasks.size > 0" :size="8">
                <NButton size="small" type="primary" @click="openBulkStatusModal">
                  Change Status
                </NButton>
                <NButton size="small" @click="deselectAllTasks">
                  Clear
                </NButton>
              </NSpace>
            </div>

            <NDataTable
              v-if="project?.tasks && project.tasks.length > 0"
              :columns="taskTableColumns"
              :data="filteredTaskList"
              :pagination="{ pageSize: 20 }"
              :bordered="false"
              :row-key="(row: any) => row.id"
              :checked-row-keys="Array.from(selectedTasks)"
              :row-props="(row: any) => ({
                style: 'cursor: pointer;',
                onClick: () => handleTaskClick(row)
              })"
              @update:checked-row-keys="(keys: any) => selectedTasks = new Set(keys as string[])"
            />

            <NEmpty v-else description="No tasks yet" class="py-12">
              <template #extra>
                <NText depth="3" class="text-sm">Tasks are created automatically when you upload assets</NText>
              </template>
            </NEmpty>
          </NCard>
        </div>

        <!-- Labels Tab -->
        <div v-if="activeTab === 'labels'">
          <ProjectLabelSchemaEditor :project-id="projectId" :tool-type="project.toolType" />
        </div>

        <!-- Comments Tab -->
        <div v-if="activeTab === 'comments'">
          <NCard size="small">
            <template #header>
              <div class="flex items-center justify-between">
                <span>Project Comments</span>
                <NSpace :size="8">
                  <NSelect
                    v-model:value="commentStatusFilter"
                    placeholder="All Comments"
                    :options="[
                      { label: 'Unresolved', value: 'unresolved' },
                      { label: 'Resolved', value: 'resolved' }
                    ]"
                    style="width: 140px"
                    size="small"
                    clearable
                  />
                </NSpace>
              </div>
            </template>

            <div v-if="filteredProjectComments.length === 0" class="py-12">
              <NEmpty description="No comments yet" size="small">
                <template #extra>
                  <NText depth="3" class="text-sm">
                    Comments will appear here when labelers add questions or notes during annotation
                  </NText>
                </template>
              </NEmpty>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="comment in filteredProjectComments"
                :key="comment.id"
                class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                @click="navigateToComment(comment)"
              >
                <!-- Comment Header -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="comment.resolved ? 'bg-green-500' : 'bg-amber-500'"
                    />
                    <NText class="text-sm font-medium">{{ comment.author }}</NText>
                  </div>
                  <NText depth="3" class="text-xs">
                    {{ new Date(comment.createdAt).toLocaleString() }}
                  </NText>
                </div>

                <!-- Comment Message -->
                <NText class="text-sm text-gray-700 dark:text-gray-300 block mb-3">
                  {{ comment.message }}
                </NText>

                <!-- Task Info -->
                <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <NIcon :size="14" class="text-gray-400">
                    <ImageIcon />
                  </NIcon>
                  <NText depth="3" class="text-xs">
                    Task: {{ getTaskName(comment.taskId) }}
                  </NText>
                  <NButton text size="tiny" type="primary">
                    View in Annotation Tool →
                  </NButton>
                </div>
              </div>
            </div>
          </NCard>
        </div>

        <!-- Export Tab -->
        <div v-if="activeTab === 'export'">
          <ProjectExportTabNew :project-id="projectId" :project="project" />
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'">
          <NCollapse :default-expanded-names="['general']">
            <!-- General Settings -->
            <NCollapseItem name="general">
              <template #header>
                <div class="flex items-center gap-2">
                  <NIcon :size="18"><Settings /></NIcon>
                  <span class="font-semibold">General Settings</span>
                </div>
              </template>
              
              <div class="space-y-4">
              <NFormItem label="Project Name">
                <NInput
                  v-model:value="project.name"
                  placeholder="Enter project name"
                  disabled
                />
              </NFormItem>
              
              <NFormItem label="Description">
                <NInput
                  v-model:value="project.description"
                  type="textarea"
                  placeholder="Project description"
                  :rows="3"
                  disabled
                />
              </NFormItem>
              
              <NFormItem label="Project Status">
                <NSelect
                  v-model:value="project.status"
                  :options="[
                    { label: 'Active', value: 'active' },
                    { label: 'Paused', value: 'paused' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Archived', value: 'archived' }
                  ]"
                  disabled
                />
              </NFormItem>
              
              <div class="flex justify-end pt-2">
                <NButton type="primary" size="small" disabled>
                  Save Changes
                </NButton>
                </div>
              </div>
            </NCollapseItem>

            <!-- Members Section -->
            <NCollapseItem name="members">
              <template #header>
                <div class="flex items-center gap-2">
                  <NIcon :size="18"><MessageSquare /></NIcon>
                  <span class="font-semibold">Team Members</span>
                </div>
              </template>
              
              <div class="mb-3">
                <NButton size="small" type="primary">
                  <template #icon>
                    <Plus :size="14" />
                  </template>
                  Add Member
                </NButton>
              </div>
              
              <NEmpty description="No team members yet" size="small">
              <template #extra>
                <NText depth="3" class="text-xs">
                  Invite team members to collaborate on this project
                </NText>
              </template>
              </NEmpty>
            </NCollapseItem>

            <!-- Guidelines Section -->
            <NCollapseItem name="guidelines">
              <template #header>
                <div class="flex items-center gap-2">
                  <NIcon :size="18"><FileText /></NIcon>
                  <span class="font-semibold">Annotation Guidelines</span>
                </div>
              </template>
              
              <div class="space-y-4">
                <!-- PDF Upload -->
                <NFormItem label="Upload Guidelines PDF">
                  <NUpload
                    :max="1"
                    accept=".pdf"
                    :default-upload="false"
                    @change="handleGuidelineUpload"
                    :show-file-list="false"
                  >
                    <NButton size="small">
                      <template #icon>
                        <Upload :size="14" />
                      </template>
                      Choose PDF File
                    </NButton>
                  </NUpload>
                </NFormItem>

                <!-- Current PDF Display -->
                <div v-if="(project as any).metadata?.guidelinesPdfUrl" class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <NIcon :size="20" color="#EF4444"><FileText /></NIcon>
                      <div>
                        <NText class="text-sm font-medium block">Guidelines PDF</NText>
                        <NText depth="3" class="text-xs">Click to preview</NText>
                      </div>
                    </div>
                    <NSpace>
                      <NButton text size="tiny" type="primary" @click="showGuidelinesPdf = true">
                        Preview
                      </NButton>
                      <NButton text size="tiny" type="error">
                        Remove
                      </NButton>
                    </NSpace>
                  </div>
                </div>

                <!-- Text Guidelines (fallback) -->
                <NFormItem label="Text Guidelines (Optional)">
                  <NInput
                    type="textarea"
                    placeholder="Enter additional text instructions for labelers..."
                    :rows="6"
                    :value="(project as any).metadata?.guidelines || ''"
                  />
                </NFormItem>
              
                <div class="flex justify-end">
                  <NButton type="primary" size="small">
                    Save Guidelines
                  </NButton>
                </div>
              </div>
            </NCollapseItem>

            <!-- Batches Section -->
            <NCollapseItem name="batches">
              <template #header>
                <div class="flex items-center gap-2">
                  <NIcon :size="18"><Tags /></NIcon>
                  <span class="font-semibold">Batch Management</span>
                </div>
              </template>
              
              <div v-if="uniqueBatches.length === 0">
                <NEmpty description="No batches created yet" size="small">
                  <template #extra>
                    <NText depth="3" class="text-xs">
                      Batches are created automatically when you upload assets with a batch name
                    </NText>
                  </template>
                </NEmpty>
              </div>
              
              <div v-else class="space-y-2">
                <div
                  v-for="batch in uniqueBatches"
                  :key="batch"
                  class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <NTag type="warning" size="small">{{ batch }}</NTag>
                    <NText depth="3" class="text-xs">
                      {{ getBatchAssetCount(batch) }} assets
                    </NText>
                  </div>
                  <NButton text size="tiny" type="error">
                    Delete Batch
                  </NButton>
                </div>
              </div>
            </NCollapseItem>

            <!-- Danger Zone -->
            <NCollapseItem name="danger">
              <template #header>
                <div class="flex items-center gap-2">
                  <NIcon :size="18" color="#EF4444"><AlertTriangle /></NIcon>
                  <span class="font-semibold text-red-600 dark:text-red-400">Danger Zone</span>
                </div>
              </template>
              
              <div class="space-y-4">
              <div class="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-900/10">
                <div class="flex items-start justify-between">
                  <div>
                    <NText class="font-medium text-red-900 dark:text-red-100 block mb-1">
                      Archive Project
                    </NText>
                    <NText depth="3" class="text-xs text-red-700 dark:text-red-300">
                      Archive this project. You can restore it later from archived projects.
                    </NText>
                  </div>
                  <NButton size="small" type="warning">
                    Archive
                  </NButton>
                </div>
              </div>
              
              <div class="p-4 border border-red-300 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                <div class="flex items-start justify-between">
                  <div>
                    <NText class="font-medium text-red-900 dark:text-red-100 block mb-1">
                      Delete Project
                    </NText>
                    <NText depth="3" class="text-xs text-red-700 dark:text-red-300">
                      Permanently delete this project and all its data. This action cannot be undone.
                    </NText>
                  </div>
                  <NButton size="small" type="error" @click="handleDeleteProject">
                    Delete Project
                  </NButton>
                </div>
              </div>
              </div>
            </NCollapseItem>
          </NCollapse>
        </div>
      </div>
    </div>

    <!-- Guidelines PDF Viewer Modal -->
    <NModal
      v-model:show="showGuidelinesPdf"
      preset="card"
      title="Annotation Guidelines"
      style="width: 90%; max-width: 1200px"
      :bordered="false"
    >
      <div v-if="(project as any).metadata?.guidelinesPdfUrl" class="h-[80vh]">
        <iframe
          :src="(project as any).metadata.guidelinesPdfUrl"
          class="w-full h-full border-0 rounded"
          title="Guidelines PDF"
        />
      </div>
    </NModal>

    <!-- Bulk Status Change Modal -->
    <BulkStatusChangeModal
      v-model:show="showBulkStatusModal"
      :selected-task-ids="Array.from(selectedTasks)"
      :project-id="projectId"
      @success="handleBulkStatusSuccess"
    />
  </div>
</template>
