import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { userId, type, title, message, projectId, taskId, data } = body

    if (!userId || !type || !title || !message) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        projectId,
        taskId,
        data: data || null
      }
    })

    return {
      success: true,
      data: notification
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create notification'
    })
  }
})
