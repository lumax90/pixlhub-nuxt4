import prisma from '../../../utils/prisma'
import { transitionTaskStatus } from '../../../services/taskService'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }

    const { action } = body
    
    if (!action || !['approve', 'reject'].includes(action)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid action. Must be "approve" or "reject"'
      })
    }

    // Get current task
    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      throw createError({
        statusCode: 404,
        message: 'Task not found'
      })
    }

    // Check if task is in review status
    if (task.status !== 'review') {
      throw createError({
        statusCode: 400,
        message: 'Task is not in review status'
      })
    }

    let newStatus: 'completed' | 'label'
    
    if (action === 'approve') {
      // Approve: move to completed
      newStatus = 'completed'
      console.log(`✅ Task ${id} approved - moving to completed`)
    } else {
      // Reject: send back to label queue
      newStatus = 'label'
      console.log(`❌ Task ${id} rejected - sending back to label queue`)
    }

    // Transition task status
    const updatedTask = await transitionTaskStatus(id, newStatus)

    return {
      success: true,
      data: updatedTask,
      message: action === 'approve' ? 'Task approved' : 'Task rejected and sent back to label queue'
    }
  } catch (error) {
    console.error('Error processing review:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process review'
    })
  }
})
