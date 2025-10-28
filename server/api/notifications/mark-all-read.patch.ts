import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { userId } = body

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    // Mark all as read
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to mark all notifications as read'
    })
  }
})
