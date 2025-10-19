<script setup lang="ts">
import { TrendingUp, Users, CheckCircle, Clock } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const projectStore = useProjectStore()

onMounted(async () => {
  await projectStore.fetchProjects()
})

const stats = computed(() => {
  const projects = projectStore.projects
  const totalTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0)
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0)
  const activeProjects = projects.filter(p => p.status === 'active').length

  return {
    totalProjects: projects.length,
    activeProjects,
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }
})

const statCards = computed(() => [
  {
    title: 'Total Projects',
    value: stats.value.totalProjects,
    icon: TrendingUp,
    color: 'text-pixl-blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    title: 'Active Projects',
    value: stats.value.activeProjects,
    icon: Users,
    color: 'text-pixl-success',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  {
    title: 'Completed Tasks',
    value: stats.value.completedTasks,
    icon: CheckCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  },
  {
    title: 'Total Tasks',
    value: stats.value.totalTasks,
    icon: Clock,
    color: 'text-pixl-warning',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
  }
])
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    
    <div class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Overview of your annotation workflow
        </p>
      </div>

    <!-- Stats Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <UiCard v-for="stat in statCards" :key="stat.title">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-small text-gray-600 dark:text-gray-400 mb-1">
              {{ stat.title }}
            </p>
            <p class="text-3xl font-display font-semibold text-gray-900 dark:text-gray-100">
              {{ stat.value }}
            </p>
          </div>
          <div :class="['p-2 rounded-sm', stat.bgColor]">
            <component :is="stat.icon" :size="24" :class="stat.color" />
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Completion Rate -->
    <UiCard title="Overall Completion Rate" class="mb-6">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-4">
            <div
              class="bg-gradient-to-r from-pixl-blue to-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              :style="{ width: `${stats.completionRate}%` }"
            >
              <span class="text-xs text-white font-semibold">
                {{ stats.completionRate }}%
              </span>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-small text-gray-600 dark:text-gray-400">
            <span>{{ stats.completedTasks }} completed</span>
            <span>{{ stats.totalTasks }} total</span>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- Recent Projects -->
    <UiCard title="Recent Projects">
      <div v-if="projectStore.projects.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        No projects available
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="project in projectStore.projects.slice(0, 5)"
          :key="project.id"
          class="flex items-center justify-between p-3 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800 pixl-transition"
        >
          <div class="flex-1">
            <h4 class="text-body font-medium text-gray-900 dark:text-gray-100">
              {{ project.name }}
            </h4>
            <p class="text-small text-gray-600 dark:text-gray-400">
              {{ project.completedTasks }} / {{ project.totalTasks }} tasks completed
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-24 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div
                class="bg-pixl-blue h-2 rounded-full"
                :style="{ width: `${(project.completedTasks / project.totalTasks) * 100}%` }"
              />
            </div>
            <span class="text-small font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
              {{ Math.round((project.completedTasks / project.totalTasks) * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </UiCard>
    </div>
  </div>
</template>
