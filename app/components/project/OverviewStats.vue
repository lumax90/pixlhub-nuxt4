<script setup lang="ts">
import { NCard, NStatistic, NTag, NProgress, NSkeleton } from 'naive-ui'
import { BarChart3, Tags, Box, CheckCircle, Clock, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
}>()

// Stats state
const stats = ref({
  totalAnnotations: 0,
  bboxCount: 0,
  polygonCount: 0,
  pointCount: 0,
  labelStats: {} as Record<string, number>,
  completedTasks: 0,
  labeledTasks: 0,
  reviewTasks: 0,
  pendingTasks: 0,
  totalDuration: 0,
  avgTimePerTask: 0,
  fastestTask: 0,
  slowestTask: 0
})

const isLoading = ref(false)

// Load stats
const loadStats = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any }>(`/api/projects/${props.projectId}/export-stats`)
    if (response.success && response.data) {
      stats.value = {
        ...stats.value,
        ...response.data
      }
    }
  } catch (error) {
    console.error('Failed to load overview stats:', error)
  } finally {
    isLoading.value = false
  }
}

// Computed values
const totalLabels = computed(() => Object.keys(stats.value.labelStats).length)
const topLabels = computed(() => {
  return Object.entries(stats.value.labelStats)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
})

// Format duration in seconds to human readable
const formatDuration = (seconds: number) => {
  if (seconds === 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
    <!-- Annotation Statistics -->
    <NCard title="Annotation Statistics" size="small">
      <template #header-extra>
        <BarChart3 :size="18" class="text-gray-400" />
      </template>
      
      <div v-if="isLoading" class="space-y-3">
        <NSkeleton height="40px" />
        <NSkeleton height="40px" />
        <NSkeleton height="40px" />
      </div>
      
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Total Annotations</span>
          <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {{ stats.totalAnnotations }}
          </span>
        </div>
        
        <div class="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Bounding Boxes</span>
            <div class="flex items-center gap-2">
              <NProgress
                type="line"
                :percentage="stats.totalAnnotations > 0 ? (stats.bboxCount / stats.totalAnnotations) * 100 : 0"
                :show-indicator="false"
                :height="6"
                class="w-20"
              />
              <span class="font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                {{ stats.bboxCount }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Polygons</span>
            <div class="flex items-center gap-2">
              <NProgress
                type="line"
                :percentage="stats.totalAnnotations > 0 ? (stats.polygonCount / stats.totalAnnotations) * 100 : 0"
                :show-indicator="false"
                :height="6"
                class="w-20"
              />
              <span class="font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                {{ stats.polygonCount }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Points</span>
            <div class="flex items-center gap-2">
              <NProgress
                type="line"
                :percentage="stats.totalAnnotations > 0 ? (stats.pointCount / stats.totalAnnotations) * 100 : 0"
                :show-indicator="false"
                :height="6"
                class="w-20"
              />
              <span class="font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                {{ stats.pointCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Label Distribution -->
    <NCard title="Label Distribution" size="small">
      <template #header-extra>
        <Tags :size="18" class="text-gray-400" />
      </template>
      
      <div v-if="isLoading" class="space-y-3">
        <NSkeleton height="40px" />
        <NSkeleton height="40px" />
      </div>
      
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Total Labels</span>
          <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {{ totalLabels }}
          </span>
        </div>
        
        <div v-if="topLabels.length > 0" class="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Top 5 Labels:
          </div>
          <div
            v-for="label in topLabels"
            :key="label.name"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-600 dark:text-gray-400 truncate mr-2">{{ label.name }}</span>
            <NTag size="small" type="info">{{ label.count }}</NTag>
          </div>
          
          <div v-if="totalLabels > 5" class="text-xs text-gray-500 text-center pt-2">
            +{{ totalLabels - 5 }} more labels
          </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-4">
          No labels defined yet
        </div>
      </div>
    </NCard>

    <!-- Time Statistics -->
    <NCard title="Time Statistics" size="small">
      <template #header-extra>
        <Clock :size="18" class="text-gray-400" />
      </template>
      
      <div v-if="isLoading" class="space-y-3">
        <NSkeleton height="40px" />
        <NSkeleton height="40px" />
      </div>
      
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Total Duration</span>
          <span class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {{ formatDuration(stats.totalDuration || 0) }}
          </span>
        </div>
        
        <div class="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Avg. Time per Task</span>
            <span class="text-lg font-medium text-gray-900 dark:text-gray-100">
              {{ formatDuration(stats.avgTimePerTask || 0) }}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Fastest Task</span>
            <span class="text-sm font-medium text-green-600">
              {{ formatDuration(stats.fastestTask || 0) }}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Slowest Task</span>
            <span class="text-sm font-medium text-orange-600">
              {{ formatDuration(stats.slowestTask || 0) }}
            </span>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>
