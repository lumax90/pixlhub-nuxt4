import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const taskId = getRouterParam(event, 'id')

    if (!taskId) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }

    // Get task with asset
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        asset: true,
        project: {
          select: {
            id: true,
            name: true,
            toolType: true,
            annotationType: true
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

    const asset = task.asset

    // Return content based on asset type
    return {
      success: true,
      data: {
        taskId: task.id,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        assetUrl: asset.url,
        content: asset.content, // For text/RLHF
        metadata: asset.metadata,
        project: task.project
      }
    }
  } catch (error) {
    console.error('Error fetching task content:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch task content'
    })
  }
})
