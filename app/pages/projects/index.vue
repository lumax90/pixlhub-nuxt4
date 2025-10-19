<script setup lang="ts">
import { Plus, FolderOpen, Clock, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const projectStore = useProjectStore()
const router = useRouter()

// Fetch projects on mount
onMounted(async () => {
  await projectStore.fetchProjects()
})

const getStatusColor = (status: string) => {
  const colors = {
    draft: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
    active: 'text-pixl-success bg-green-100 dark:bg-green-900/20',
    paused: 'text-pixl-warning bg-yellow-100 dark:bg-yellow-900/20',
    completed: 'text-pixl-blue bg-blue-100 dark:bg-blue-900/20',
    archived: 'text-gray-500 bg-gray-100 dark:bg-gray-800'
  }
  return colors[status as keyof typeof colors] || colors.draft
}

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    
    <div class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Projects</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your annotation projects
          </p>
        </div>
        <UiButton variant="primary">
          <Plus :size="18" />
          New Project
        </UiButton>
      </div>

    <!-- Loading State -->
    <div v-if="projectStore.isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin w-8 h-8 border-4 border-pixl-blue border-t-transparent rounded-full" />
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiCard
        v-for="project in projectStore.projects"
        :key="project.id"
        hoverable
        class="cursor-pointer"
        @click="goToProject(project.id)"
      >
        <div class="flex flex-col gap-3">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="p-2 bg-pixl-blue/10 rounded-sm">
              <FolderOpen :size="24" class="text-pixl-blue" />
            </div>
            <span
              :class="[
                'px-2 py-1 rounded text-xs font-medium',
                getStatusColor(project.status)
              ]"
            >
              {{ project.status }}
            </span>
          </div>

          <!-- Project Info -->
          <div>
            <h3 class="text-h3 text-gray-900 dark:text-gray-100 mb-1">
              {{ project.name }}
            </h3>
            <p class="text-small text-gray-600 dark:text-gray-400">
              {{ project.description }}
            </p>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-1 text-small text-gray-600 dark:text-gray-400">
              <Clock :size="16" />
              <span>{{ project.totalTasks }} tasks</span>
            </div>
            <div class="flex items-center gap-1 text-small text-pixl-success">
              <CheckCircle2 :size="16" />
              <span>{{ project.completedTasks }} done</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div
              class="bg-pixl-blue h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(project.completedTasks / project.totalTasks) * 100}%` }"
            />
          </div>

          <!-- Annotation Type -->
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Type: <span class="font-medium">{{ project.annotationType }}</span>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Empty State -->
    <div
      v-if="!projectStore.isLoading && projectStore.projects.length === 0"
      class="text-center py-20"
    >
      <FolderOpen :size="64" class="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
      <h3 class="text-h3 text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
      <p class="text-body text-gray-600 dark:text-gray-400 mb-6">
        Create your first annotation project to get started
      </p>
      <UiButton variant="primary">
        <Plus :size="18" />
        Create Project
      </UiButton>
    </div>
    </div>
  </div>
</template>
