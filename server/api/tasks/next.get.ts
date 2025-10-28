import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const projectId = query.projectId as string
    const status = (query.status as string) || 'label'
    const currentTaskId = query.currentTaskId as string

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // If currentTaskId is provided, navigate to next task in sequence
    if (currentTaskId) {
      const tasks = await prisma.task.findMany({
        where: { 
          projectId,
          status: {
            in: ['label', 'review'] // Show active tasks, exclude completed
          }
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      })

      const currentIndex = tasks.findIndex(t => t.id === currentTaskId)
      
      if (currentIndex === -1 || currentIndex === tasks.length - 1) {
        return {
          success: false,
          data: null,
          message: 'No next task'
        }
      }

      return {
        success: true,
        data: tasks[currentIndex + 1]
      }
    }

    // Otherwise, get next available task from queue
    const task = await prisma.task.findFirst({
      where: {
        projectId,
        status,
        assignedTo: null // Only unassigned tasks
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        asset: true
      }
    })

    if (!task) {
      return {
        success: false,
        message: 'No tasks available in queue'
      }
    }

    return {
      success: true,
      data: task
    }
  } catch (error) {
    console.error('Error getting next task:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get next task'
    })
  }
})
