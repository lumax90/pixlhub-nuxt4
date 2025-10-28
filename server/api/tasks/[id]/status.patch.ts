import prisma from '../../../utils/prisma'
import { transitionTaskStatus } from '../../../services/taskService'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { status } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }

    if (!status) {
      throw createError({
        statusCode: 400,
        message: 'Status is required'
      })
    }

    // Use task service to transition status (handles queue management)
    const task = await transitionTaskStatus(id, status)

    // Check if this status change completes a queue (for notifications)
    const taskWithProject = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true
      }
    })

    if (taskWithProject) {
      const projectId = taskWithProject.projectId
      
      // Check queue completion and send notifications only when ALL tasks in a queue are done
      if (status === 'review') {
        // Check if ALL label tasks are now in review (label queue empty)
        const remainingLabelTasks = await prisma.task.count({
          where: { projectId, status: 'label' }
        })
        
        if (remainingLabelTasks === 0) {
          // All labeling complete! Notify reviewer
          const { notifyAllLabelingComplete } = await import('../../../services/notificationService')
          await notifyAllLabelingComplete(
            'demo-user', // TODO: Get actual reviewer user ID
            projectId,
            taskWithProject.project.name
          )
        }
      } else if (status === 'completed') {
        // Check if ALL tasks are now completed (project done)
        const remainingTasks = await prisma.task.count({
          where: { 
            projectId,
            status: { in: ['label', 'review'] }
          }
        })
        
        if (remainingTasks === 0) {
          // All tasks complete! Notify project owner
          const { notifyProjectComplete } = await import('../../../services/notificationService')
          await notifyProjectComplete(
            'demo-user', // TODO: Get actual project owner user ID
            projectId,
            taskWithProject.project.name
          )
        }
      }
    }

    return {
      success: true,
      data: task,
      message: 'Task status updated successfully'
    }
  } catch (error) {
    console.error('Error updating task status:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update task status'
    })
  }
})
