import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Notification ID is required'
      })
    }

    // Mark as read
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    return {
      success: true,
      data: notification
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to mark notification as read'
    })
  }
})
