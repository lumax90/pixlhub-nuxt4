import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const taskId = getRouterParam(event, 'taskId')
    
    if (!taskId) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }

    const annotations = await prisma.annotation.findMany({
      where: { taskId },
      include: {
        label: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return {
      success: true,
      data: annotations
    }
  } catch (error) {
    console.error('Error fetching annotations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch annotations'
    })
  }
})
