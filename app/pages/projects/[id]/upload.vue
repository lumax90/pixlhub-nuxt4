<script setup lang="ts">
import { Upload, ArrowLeft, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-vue-next'
import { NButton, NCard, NUpload, NUploadDragger, NIcon, NText, NProgress, NSpace, NTag, useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useProjectStore()

const projectId = route.params.id as string
const project = computed(() => projectStore.projects.find(p => p.id === projectId))

const fileList = ref<UploadFileInfo[]>([])
const isUploading = ref(false)
const uploadProgress = ref(0)

// Load project
onMounted(async () => {
  if (!project.value) {
    await projectStore.fetchProjectById(projectId)
  }
})

// Handle file selection
const handleFileChange = (options: { fileList: UploadFileInfo[] }) => {
  fileList.value = options.fileList
}

// Upload files
const handleUpload = async () => {
  if (fileList.value.length === 0) {
    message.warning('Please select files to upload')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('projectId', projectId)

    fileList.value.forEach((file) => {
      if (file.file) {
        formData.append('files', file.file)
      }
    })

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()

    message.success(result.message || 'Files uploaded successfully')
    
    // Refresh project data
    await projectStore.fetchProjectById(projectId)
    
    // Clear file list
    fileList.value = []
    uploadProgress.value = 100

    // Redirect to project page after short delay
    setTimeout(() => {
      router.push(`/projects/${projectId}`)
    }, 1500)

  } catch (error) {
    console.error('Upload error:', error)
    message.error('Failed to upload files')
  } finally {
    isUploading.value = false
  }
}

const goBack = () => {
  router.push(`/projects/${projectId}`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    
    <div class="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <NButton text @click="goBack" size="small" class="mb-4">
          <template #icon>
            <ArrowLeft :size="14" />
          </template>
          Back to Project
        </NButton>
        
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Upload Assets
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Upload images to <span class="font-medium">{{ project?.name }}</span>
        </p>
      </div>

      <!-- Upload Area -->
      <NCard size="large" class="mb-4">
        <NUpload
          multiple
          directory-dnd
          :file-list="fileList"
          @change="handleFileChange"
          :default-upload="false"
          accept="image/*"
        >
          <NUploadDragger>
            <div class="py-12">
              <div class="flex justify-center mb-4">
                <NIcon :size="48" :depth="3" color="#2563EB">
                  <Upload />
                </NIcon>
              </div>
              <NText class="text-base font-medium block mb-2">
                Click or drag files to this area to upload
              </NText>
              <NText depth="3" class="text-sm">
                Support for single or bulk upload. Accepted formats: JPG, PNG, GIF, WebP
              </NText>
            </div>
          </NUploadDragger>
        </NUpload>

        <!-- File List Summary -->
        <div v-if="fileList.length > 0" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <ImageIcon :size="18" class="text-gray-600 dark:text-gray-400" />
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ fileList.length }} file(s) selected
              </span>
            </div>
            <NTag type="info" size="small">
              Total: {{ (fileList.reduce((sum, f) => sum + (f.file?.size || 0), 0) / 1024 / 1024).toFixed(2) }} MB
            </NTag>
          </div>

          <!-- Progress -->
          <NProgress
            v-if="isUploading"
            type="line"
            :percentage="uploadProgress"
            :height="8"
            :show-indicator="false"
            class="mb-4"
          />
        </div>
      </NCard>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <NButton @click="goBack" size="large">
          Cancel
        </NButton>
        
        <NButton
          type="primary"
          size="large"
          :disabled="fileList.length === 0"
          :loading="isUploading"
          @click="handleUpload"
        >
          <template #icon>
            <NIcon><Upload /></NIcon>
          </template>
          Upload {{ fileList.length > 0 ? `${fileList.length} File(s)` : '' }}
        </NButton>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <NCard size="small" title="Supported Formats">
          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• JPEG / JPG</li>
            <li>• PNG</li>
            <li>• GIF</li>
            <li>• WebP</li>
          </ul>
        </NCard>

        <NCard size="small" title="What Happens Next?">
          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Files are uploaded to the server</li>
            <li>• Tasks are created automatically</li>
            <li>• Ready for annotation immediately</li>
          </ul>
        </NCard>
      </div>
    </div>
  </div>
</template>
