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

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete notification'
    })
  }
})
