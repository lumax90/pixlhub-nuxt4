import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        asset: true, // Include the asset
        annotations: {
          include: {
            label: true
          }
        },
        project: {
          include: {
            labels: true
          }
        }
      }
    })

    if (!task) {
      throw createError({
        statusCode: 404,
        message: 'Task not found'
      })
    }

    return {
      success: true,
      data: task
    }
  } catch (error) {
    console.error('Error fetching task:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch task'
    })
  }
})
