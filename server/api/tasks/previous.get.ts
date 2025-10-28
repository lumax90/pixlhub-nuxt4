import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const projectId = query.projectId as string
    const currentTaskId = query.currentTaskId as string

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // Get active tasks (label + review, exclude completed) for this project
    const tasks = await prisma.task.findMany({
      where: { 
        projectId,
        status: {
          in: ['label', 'review'] // Show tasks you're actively working on
        }
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    })

    if (!currentTaskId) {
      // Return first task if no current task
      return {
        success: true,
        data: tasks[0] || null
      }
    }

    // Find current task index
    const currentIndex = tasks.findIndex(t => t.id === currentTaskId)
    
    if (currentIndex === -1 || currentIndex === 0) {
      return {
        success: false,
        data: null,
        message: 'No previous task'
      }
    }

    // Return previous task
    return {
      success: true,
      data: tasks[currentIndex - 1]
    }
  } catch (error) {
    console.error('Error getting previous task:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get previous task'
    })
  }
})
