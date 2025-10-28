<script setup lang="ts">
import { TrendingUp, Users, CheckCircle, Clock, FolderOpen, Activity } from 'lucide-vue-next'
import { NGrid, NGridItem, NCard, NStatistic, NProgress, NList, NListItem, NThing, NIcon, NSpace, NTag } from 'naive-ui'

definePageMeta({
  layout: false
})

const projectStore = useProjectStore()
const router = useRouter()

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

// Chart data for project distribution
const projectsByType = computed(() => {
  const types = projectStore.projects.reduce((acc, p) => {
    acc[p.toolType] = (acc[p.toolType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  return Object.entries(types).map(([name, value]) => ({ name, value }))
})

// Recent activity
const recentActivity = computed(() => [
  { type: 'completed', project: 'Street Signs Detection', time: '2 hours ago' },
  { type: 'started', project: 'Vehicle Classification', time: '5 hours ago' },
  { type: 'review', project: 'Pedestrian Tracking', time: '1 day ago' },
  { type: 'created', project: 'Traffic Light Detection', time: '2 days ago' }
])

function goToProject(id: string) {
  router.push(`/projects/${id}`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <AppHeader />
    
    <div class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          Overview of your annotation workflow
        </p>
      </div>

      <!-- Stats Grid -->
      <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" class="mb-4">
        <NGridItem>
          <NCard size="small" :bordered="false">
            <NStatistic label="Total Projects" :value="stats.totalProjects">
              <template #prefix>
                <NIcon :size="20" color="#3B82F6">
                  <FolderOpen />
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" :bordered="false">
            <NStatistic label="Active Projects" :value="stats.activeProjects">
              <template #prefix>
                <NIcon :size="20" color="#10B981">
                  <Activity />
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" :bordered="false">
            <NStatistic label="Completed Tasks" :value="stats.completedTasks">
              <template #prefix>
                <NIcon :size="20" color="#8B5CF6">
                  <CheckCircle />
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" :bordered="false">
            <NStatistic label="Total Tasks" :value="stats.totalTasks">
              <template #prefix>
                <NIcon :size="20" color="#F59E0B">
                  <Clock />
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- Charts & Progress -->
      <NGrid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" class="mb-4">
        <!-- Overall Progress -->
        <NGridItem>
          <NCard title="Overall Completion" size="small" :bordered="false">
            <NProgress
              type="circle"
              :percentage="stats.completionRate"
              :stroke-width="12"
              :height="180"
            >
              <div class="text-center">
                <div class="text-2xl font-bold">{{ stats.completionRate }}%</div>
                <div class="text-xs text-gray-500 mt-1">Complete</div>
              </div>
            </NProgress>
            <div class="flex justify-between mt-4 text-xs text-gray-600 dark:text-gray-400">
              <span>{{ stats.completedTasks }} done</span>
              <span>{{ stats.totalTasks - stats.completedTasks }} remaining</span>
            </div>
          </NCard>
        </NGridItem>

        <!-- Project Distribution -->
        <NGridItem>
          <NCard title="Project Distribution" size="small" :bordered="false">
            <div class="space-y-3">
              <div v-for="item in projectsByType" :key="item.name" class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="capitalize">{{ item.name }}</span>
                  <span class="font-medium">{{ item.value }}</span>
                </div>
                <NProgress
                  :percentage="(item.value / stats.totalProjects) * 100"
                  :show-indicator="false"
                  :height="6"
                />
              </div>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- Recent Projects & Activity -->
      <NGrid :cols="2" :x-gap="12" :y-gap="12" responsive="screen">
        <!-- Recent Projects -->
        <NGridItem>
          <NCard title="Recent Projects" size="small" :bordered="false">
            <NList v-if="projectStore.projects.length > 0" hoverable clickable>
              <NListItem
                v-for="project in projectStore.projects.slice(0, 5)"
                :key="project.id"
                @click="goToProject(project.id)"
              >
                <NThing :title="project.name">
                  <template #description>
                    <NSpace :size="8" align="center">
                      <span class="text-xs">{{ project.completedTasks }}/{{ project.totalTasks }} tasks</span>
                      <NTag
                        :type="project.status === 'active' ? 'success' : 'default'"
                        size="small"
                      >
                        {{ project.status }}
                      </NTag>
                    </NSpace>
                  </template>
                  <template #footer>
                    <NProgress
                      :percentage="project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0"
                      :show-indicator="false"
                      :height="4"
                    />
                  </template>
                </NThing>
              </NListItem>
            </NList>
            <div v-else class="text-center py-8 text-xs text-gray-500">
              No projects yet
            </div>
          </NCard>
        </NGridItem>

        <!-- Recent Activity -->
        <NGridItem>
          <NCard title="Recent Activity" size="small" :bordered="false">
            <NList>
              <NListItem v-for="(activity, index) in recentActivity" :key="index">
                <NThing>
                  <template #avatar>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="[
                      activity.type === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                      activity.type === 'started' ? 'bg-blue-100 dark:bg-blue-900/20' :
                      activity.type === 'review' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                      'bg-gray-100 dark:bg-gray-800'
                    ]">
                      <CheckCircle v-if="activity.type === 'completed'" :size="14" class="text-green-600" />
                      <Activity v-else-if="activity.type === 'started'" :size="14" class="text-blue-600" />
                      <Clock v-else :size="14" class="text-gray-600" />
                    </div>
                  </template>
                  <template #header>
                    <span class="text-xs font-medium capitalize">{{ activity.type }}</span>
                  </template>
                  <template #description>
                    <div class="text-xs text-gray-600 dark:text-gray-400">{{ activity.project }}</div>
                  </template>
                  <template #footer>
                    <span class="text-xs text-gray-500">{{ activity.time }}</span>
                  </template>
                </NThing>
              </NListItem>
            </NList>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>
  </div>
</template>
