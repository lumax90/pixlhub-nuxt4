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

    // Delete all notifications for this user
    await prisma.notification.deleteMany({
      where: { userId }
    })

    console.log(`🧹 Cleared all notifications for user: ${userId}`)

    return {
      success: true,
      message: 'All notifications cleared'
    }
  } catch (error) {
    console.error('Error clearing notifications:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to clear notifications'
    })
  }
})
