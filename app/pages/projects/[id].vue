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
  Pause,
  MoreVertical
} from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

console.log('Project Detail Page Loaded - ID:', projectId)

const activeTab = ref('overview')

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'assets', label: 'Assets', icon: Image },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'labels', label: 'Label Schema', icon: Tags },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings }
]

// Mock project data
const project = ref({
  id: projectId,
  name: 'Street Signs Detection',
  description: 'Annotate traffic signs and road markings for autonomous vehicle training',
  status: 'active',
  totalTasks: 1250,
  completedTasks: 847,
  totalAssets: 5000,
  annotationType: 'bounding-box',
  createdAt: '2024-01-15',
  updatedAt: '2024-10-19'
})

const goToAnnotate = () => {
  router.push('/annotate')
}

const goBack = () => {
  router.push('/projects')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    
    <div class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      <!-- Back Button & Project Header -->
      <div class="mb-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ArrowLeft :size="16" />
          Back to Projects
        </button>
        
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {{ project.name }}
              </h1>
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  project.status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                ]"
              >
                {{ project.status }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ project.description }}
            </p>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="goToAnnotate"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              <Play :size="16" />
              Start Annotating
            </button>
            <button
              class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <MoreVertical :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-800 mb-6">
        <nav class="flex gap-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-700'
            ]"
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="pb-8">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Stats Cards -->
          <div class="grid md:grid-cols-4 gap-4">
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ project.totalAssets }}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Tasks</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ project.totalTasks }}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ project.completedTasks }}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Progress</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {{ Math.round((project.completedTasks / project.totalTasks) * 100) }}%
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Overall Progress</h3>
            <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
              <div
                class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                :style="{ width: `${(project.completedTasks / project.totalTasks) * 100}%` }"
              />
            </div>
            <div class="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>{{ project.completedTasks }} completed</span>
              <span>{{ project.totalTasks - project.completedTasks }} remaining</span>
            </div>
          </div>

          <!-- Project Info -->
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Information</h3>
            <div class="grid md:grid-cols-2 gap-4">
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
          </div>
        </div>

        <!-- Assets Tab -->
        <div v-if="activeTab === 'assets'" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">Assets management coming soon...</p>
        </div>

        <!-- Tasks Tab -->
        <div v-if="activeTab === 'tasks'" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">Task management coming soon...</p>
        </div>

        <!-- Labels Tab -->
        <div v-if="activeTab === 'labels'">
          <ProjectLabelSchemaTab :project-id="projectId" />
        </div>

        <!-- Comments Tab -->
        <div v-if="activeTab === 'comments'" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">Comments section coming soon...</p>
        </div>

        <!-- Export Tab -->
        <div v-if="activeTab === 'export'" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">Export options coming soon...</p>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">Project settings coming soon...</p>
        </div>
      </div>
    </div>
  </div>
</template>
