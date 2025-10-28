import { defineStore } from 'pinia'
import type { Project, Task, DatasetItem } from '~/types'

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const currentTask = ref<Task | null>(null)
  const currentDatasetItem = ref<DatasetItem | null>(null)
  const isLoading = ref(false)

  // Getters
  const projectById = computed(() => (id: string) =>
    projects.value.find(p => p.id === id)
  )

  const activeProjects = computed(() =>
    projects.value.filter(p => p.status === 'active')
  )

  const completionRate = computed(() => {
    if (!currentProject.value || currentProject.value.totalTasks === 0) return 0
    return (currentProject.value.completedTasks / currentProject.value.totalTasks) * 100
  })

  // Actions
  function setProjects(projectList: Project[]) {
    projects.value = projectList
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  function setCurrentTask(task: Task | null) {
    currentTask.value = task
  }

  function setCurrentDatasetItem(item: DatasetItem | null) {
    currentDatasetItem.value = item
  }

  async function fetchProjects() {
    isLoading.value = true
    try {
      const response = await $fetch('/api/projects')
      
      if (response.success && response.data) {
        projects.value = response.data
        return { success: true, data: response.data }
      }
      
      return { success: false, error: 'Failed to fetch projects' }
    } catch (error) {
      console.error('Error fetching projects:', error)
      return { success: false, error: 'Failed to fetch projects' }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProjectById(id: string) {
    isLoading.value = true
    try {
      const response = await $fetch(`/api/projects/${id}`)
      
      if (response.success && response.data) {
        setCurrentProject(response.data)
        
        // Update in projects list if exists
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          projects.value[index] = response.data
        } else {
          projects.value.push(response.data)
        }
        
        return { success: true, data: response.data }
      }
      
      return { success: false, error: 'Project not found' }
    } catch (error) {
      console.error('Error fetching project:', error)
      return { success: false, error: 'Failed to fetch project' }
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(projectData: Partial<Project>) {
    isLoading.value = true
    try {
      const response = await $fetch('/api/projects', {
        method: 'POST',
        body: projectData
      })
      
      if (response.success && response.data) {
        projects.value.push(response.data)
        return { success: true, data: response.data }
      }
      
      return { success: false, error: 'Failed to create project' }
    } catch (error) {
      console.error('Error creating project:', error)
      return { success: false, error: 'Failed to create project' }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    isLoading.value = true
    try {
      const response = await $fetch(`/api/projects/${id}`, {
        method: 'PUT' as any,
        body: updates
      })
      
      if (response.success && response.data) {
        const index = projects.value.findIndex((p: Project) => p.id === id)
        if (index !== -1) {
          projects.value[index] = response.data
        }
        
        if (currentProject.value?.id === id) {
          currentProject.value = response.data
        }
        
        return { success: true, data: response.data }
      }
      
      return { success: false, error: 'Project not found' }
    } catch (error) {
      console.error('Error updating project:', error)
      return { success: false, error: 'Failed to update project' }
    } finally {
      isLoading.value = false
    }
  }

  function addProject(project: Project) {
    projects.value.push(project)
  }

  function reset() {
    projects.value = []
    currentProject.value = null
    currentTask.value = null
    currentDatasetItem.value = null
    isLoading.value = false
  }

  return {
    // State
    projects,
    currentProject,
    currentTask,
    currentDatasetItem,
    isLoading,
    
    // Getters
    projectById,
    activeProjects,
    completionRate,
    
    // Actions
    setProjects,
    setCurrentProject,
    setCurrentTask,
    setCurrentDatasetItem,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    addProject,
    reset
  }
})
