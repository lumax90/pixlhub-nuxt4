import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId as string

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    // Get notifications for user
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Count unread
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })

    return {
      success: true,
      data: notifications,
      unreadCount
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch notifications'
    })
  }
})
