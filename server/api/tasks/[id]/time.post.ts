import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const { timeSpent } = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }

    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid time value'
      })
    }

    // Update task time (increment existing time)
    await prisma.task.update({
      where: { id },
      data: {
        timeSpent: {
          increment: timeSpent
        }
      }
    })

    return {
      success: true,
      message: 'Time saved successfully'
    }
  } catch (error) {
    console.error('Error saving task time:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save task time'
    })
  }
})
