import prisma from '../utils/prisma'

export interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  message: string
  projectId?: string
  taskId?: string
  data?: any
}

/**
 * Create a notification for a user
 * Automatically enforces 100 notification limit per user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        projectId: params.projectId,
        taskId: params.taskId,
        data: params.data || null
      }
    })
    
    // Enforce 100 notification limit per user
    const userNotifications = await prisma.notification.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    })
    
    if (userNotifications.length > 100) {
      // Delete oldest notifications beyond 100
      const toDelete = userNotifications.slice(100).map(n => n.id)
      await prisma.notification.deleteMany({
        where: { id: { in: toDelete } }
      })
      console.log(`🧹 Cleaned up ${toDelete.length} old notifications for user ${params.userId}`)
    }
    
    console.log(`📬 Notification created: ${params.type} for user ${params.userId}`)
    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * Notify when task is assigned
 */
export async function notifyTaskAssigned(userId: string, taskId: string, projectId: string, projectName: string) {
  return createNotification({
    userId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned a new task in "${projectName}"`,
    projectId,
    taskId
  })
}

/**
 * DEPRECATED: Do not use - creates too many notifications
 * Use notifyAllLabelingComplete instead
 */
export async function notifyReviewRequired(userId: string, taskId: string, projectId: string, projectName: string, annotationCount: number) {
  console.warn('⚠️ notifyReviewRequired is deprecated - use notifyAllLabelingComplete instead')
  // Disabled to prevent notification spam
  return null
}

/**
 * DEPRECATED: Do not use - creates too many notifications
 * Use notifyProjectComplete instead
 */
export async function notifyTaskCompleted(userId: string, taskId: string, projectId: string, projectName: string) {
  console.warn('⚠️ notifyTaskCompleted is deprecated - use notifyProjectComplete instead')
  // Disabled to prevent notification spam
  return null
}

/**
 * Notify when comment is added
 */
export async function notifyCommentAdded(userId: string, projectId: string, projectName: string, commenterName: string) {
  return createNotification({
    userId,
    type: 'comment_added',
    title: 'New Comment',
    message: `${commenterName} commented on "${projectName}"`,
    projectId
  })
}

/**
 * Notify when export is ready
 */
export async function notifyExportReady(userId: string, projectId: string, projectName: string, format: string) {
  return createNotification({
    userId,
    type: 'export_ready',
    title: 'Export Ready',
    message: `Your ${format.toUpperCase()} export for "${projectName}" is ready`,
    projectId,
    data: { format }
  })
}

/**
 * Notify when project status changes
 */
export async function notifyProjectStatusChange(userId: string, projectId: string, projectName: string, newStatus: string) {
  return createNotification({
    userId,
    type: 'project_status_change',
    title: 'Project Status Updated',
    message: `"${projectName}" status changed to ${newStatus}`,
    projectId,
    data: { status: newStatus }
  })
}

/**
 * Notify when ALL labeling tasks are complete (label queue empty)
 */
export async function notifyAllLabelingComplete(userId: string, projectId: string, projectName: string) {
  return createNotification({
    userId,
    type: 'all_labeling_complete',
    title: 'All Labeling Complete',
    message: `All tasks in "${projectName}" have been labeled and are ready for review`,
    projectId
  })
}

/**
 * Notify when ALL tasks in project are complete
 */
export async function notifyProjectComplete(userId: string, projectId: string, projectName: string) {
  return createNotification({
    userId,
    type: 'project_complete',
    title: 'Project Complete',
    message: `All tasks in "${projectName}" have been completed! 🎉`,
    projectId
  })
}
