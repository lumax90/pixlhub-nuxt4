<script setup lang="ts">
import { Plus, FolderOpen, Grid3x3, List } from 'lucide-vue-next'
import { NButton, NCard, NDataTable, NProgress, NTag, NSpace, NButtonGroup } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: false
})

const projectStore = useProjectStore()
const router = useRouter()

// Modal state
const showCreateModal = ref(false)

// View mode
const viewMode = ref<'grid' | 'table'>('grid')

// Table columns for list view
const columns: DataTableColumns = [
  {
    title: 'Name',
    key: 'name',
    render: (row: any) => h('div', { class: 'flex items-center gap-2' }, [
      h(FolderOpen, { size: 14, class: 'text-blue-500' }),
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'text-xs font-medium text-gray-900 dark:text-gray-100 truncate' }, row.name),
        h('p', { class: 'text-xs text-gray-500 dark:text-gray-400 truncate' }, row.description)
      ])
    ])
  },
  {
    title: 'Type',
    key: 'toolType',
    width: 120,
    render: (row: any) => h('span', { class: 'text-xs capitalize' }, row.toolType)
  },
  {
    title: 'Status',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, {
      size: 'small',
      type: row.status === 'active' ? 'success' : row.status === 'paused' ? 'warning' : 'default'
    }, { default: () => row.status })
  },
  {
    title: 'Progress',
    key: 'progress',
    width: 200,
    render: (row: any) => {
      const percentage = row.totalTasks > 0 ? Math.round((row.completedTasks / row.totalTasks) * 100) : 0
      return h(NProgress, {
        type: 'line',
        percentage,
        height: 6,
        showIndicator: true,
        indicatorTextColor: '#666'
      })
    }
  },
  {
    title: 'Tasks',
    key: 'tasks',
    width: 100,
    align: 'right',
    render: (row: any) => h('span', { class: 'text-xs' }, `${row.completedTasks}/${row.totalTasks}`)
  }
]

// Handle row click
function handleRowClick(row: any) {
  goToProject(row.id)
}

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
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h1>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {{ projectStore.projects.length }} projects
          </p>
        </div>
        <NSpace>
          <!-- View Toggle -->
          <NButtonGroup size="small">
            <NButton @click="viewMode = 'grid'" :type="viewMode === 'grid' ? 'primary' : 'default'">
              <template #icon>
                <Grid3x3 :size="14" />
              </template>
            </NButton>
            <NButton @click="viewMode = 'table'" :type="viewMode === 'table' ? 'primary' : 'default'">
              <template #icon>
                <List :size="14" />
              </template>
            </NButton>
          </NButtonGroup>
          <NButton type="primary" size="small" @click="showCreateModal = true">
            <template #icon>
              <Plus :size="14" />
            </template>
            New Project
          </NButton>
        </NSpace>
      </div>

    <!-- Loading State -->
    <div v-if="projectStore.isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      <NCard
        v-for="project in projectStore.projects"
        :key="project.id"
        hoverable
        @click="goToProject(project.id)"
        class="cursor-pointer"
        size="small"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <FolderOpen :size="16" class="text-blue-500" />
            <h3 class="text-sm font-medium">
              {{ project.name }}
            </h3>
          </div>
          <NTag
            :type="project.status === 'active' ? 'success' : project.status === 'paused' ? 'warning' : 'default'"
            size="small"
          >
            {{ project.status }}
          </NTag>
        </div>
        
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {{ project.description }}
        </p>
        
        <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{{ project.toolType }}</span>
          <span>•</span>
          <span>{{ project.totalTasks }} tasks</span>
          <span>•</span>
          <span class="text-green-600 dark:text-green-400">{{ project.completedTasks }} done</span>
        </div>
        
        <NProgress
          type="line"
          :percentage="project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0"
          :height="4"
          :show-indicator="false"
        />
      </NCard>
    </div>
    
    <!-- Table View -->
    <NDataTable
      v-else
      :columns="columns"
      :data="projectStore.projects"
      :bordered="false"
      :single-line="false"
      size="small"
      :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => handleRowClick(row) })"
    />

    <!-- Empty State -->
    <div
      v-if="!projectStore.isLoading && projectStore.projects.length === 0"
      class="text-center py-12"
    >
      <FolderOpen :size="48" class="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No projects yet</h3>
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Create your first annotation project
      </p>
      <NButton type="primary" size="small" @click="showCreateModal = true">
        <template #icon>
          <Plus :size="14" />
        </template>
        New Project
      </NButton>
    </div>
    </div>
    
    <!-- Create Project Modal -->
    <ProjectCreateProjectModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
    />
  </div>
</template>
