import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const projectId = query.projectId as string

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // Get all tasks in label queue with their assets
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        status: {
          in: ['label', 'review']
        }
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            url: true,
            metadata: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return {
      success: true,
      data: tasks
    }
  } catch (error) {
    console.error('Error fetching label queue:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch label queue'
    })
  }
})
