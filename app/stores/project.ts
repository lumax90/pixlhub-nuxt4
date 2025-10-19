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
      // TODO: Implement actual API call
      // const data = await $fetch('/api/projects')
      
      // Mock data for development with UUIDs
      const mockProjects: Project[] = [
        {
          id: 'proj_8f4e9d2a1c3b5e7f',
          tenantId: 'org_acme_corp',
          name: 'Street Signs Detection',
          description: 'Annotate traffic signs and road markings for autonomous vehicle training',
          status: 'active',
          annotationType: 'bounding-box',
          totalTasks: 1250,
          completedTasks: 847,
          createdBy: 'user_john_doe',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        },
        {
          id: 'proj_2b7c4f6a9e1d8h3k',
          tenantId: 'org_acme_corp',
          name: 'Pedestrian Segmentation',
          description: 'Segment people in urban environments for crowd analysis',
          status: 'active',
          annotationType: 'segmentation',
          totalTasks: 850,
          completedTasks: 320,
          createdBy: 'user_jane_smith',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date()
        },
        {
          id: 'proj_5k9m2n4p7q1r3s6t',
          tenantId: 'org_tech_labs',
          name: 'Vehicle Classification',
          description: 'Classify vehicle types in parking lot surveillance footage',
          status: 'paused',
          annotationType: 'classification',
          totalTasks: 500,
          completedTasks: 180,
          createdBy: 'user_mike_wilson',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date()
        }
      ]
      
      setProjects(mockProjects)
      return { success: true, data: mockProjects }
    } catch (error) {
      return { success: false, error: 'Failed to fetch projects' }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProjectById(id: string) {
    isLoading.value = true
    try {
      // TODO: Implement actual API call
      // const data = await $fetch(`/api/projects/${id}`)
      
      const project = projectById.value(id)
      if (project) {
        setCurrentProject(project)
        return { success: true, data: project }
      }
      
      return { success: false, error: 'Project not found' }
    } catch (error) {
      return { success: false, error: 'Failed to fetch project' }
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(projectData: Partial<Project>) {
    isLoading.value = true
    try {
      // TODO: Implement actual API call
      // const data = await $fetch('/api/projects', {
      //   method: 'POST',
      //   body: projectData
      // })
      
      const newProject: Project = {
        id: Date.now().toString(),
        tenantId: 'tenant-1',
        totalTasks: 0,
        completedTasks: 0,
        createdBy: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...projectData
      } as Project
      
      projects.value.push(newProject)
      return { success: true, data: newProject }
    } catch (error) {
      return { success: false, error: 'Failed to create project' }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    isLoading.value = true
    try {
      // TODO: Implement actual API call
      // const data = await $fetch(`/api/projects/${id}`, {
      //   method: 'PATCH',
      //   body: updates
      // })
      
      const index = projects.value.findIndex((p: Project) => p.id === id)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...updates } as Project
        if (currentProject.value?.id === id) {
          currentProject.value = projects.value[index] || null
        }
        return { success: true, data: projects.value[index] }
      }
      
      return { success: false, error: 'Project not found' }
    } catch (error) {
      return { success: false, error: 'Failed to update project' }
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    projects.value = []
    currentProject.value = null
    currentTask.value = null
    currentDatasetItem.value = null
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
    reset
  }
})
