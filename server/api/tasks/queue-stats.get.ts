import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const projectId = query.projectId as string
    const taskId = query.taskId as string

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // Get active tasks (label + review, exclude completed) ordered by creation date
    const activeTasks = await prisma.task.findMany({
      where: { 
        projectId,
        status: {
          in: ['label', 'review']
        }
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, status: true }
    })

    // Find current task position in active tasks
    const currentTaskIndex = taskId ? activeTasks.findIndex(t => t.id === taskId) : -1
    const currentTaskNumber = currentTaskIndex >= 0 ? currentTaskIndex + 1 : 1

    // Count by status
    const labelQueue = activeTasks.filter(t => t.status === 'label').length
    const reviewQueue = activeTasks.filter(t => t.status === 'review').length
    
    // Get completed count separately
    const completedQueue = await prisma.task.count({
      where: { 
        projectId,
        status: 'completed'
      }
    })

    return {
      success: true,
      data: {
        labelQueue,
        reviewQueue,
        completedQueue,
        totalTasks: activeTasks.length, // Only count active tasks
        currentTaskNumber,
        tasksRemaining: activeTasks.length - currentTaskNumber
      }
    }
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch queue stats'
    })
  }
})
