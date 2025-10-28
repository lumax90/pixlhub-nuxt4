import prisma from '../../utils/prisma'
import { transitionTaskStatus } from '../../services/taskService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { taskIds, newStatus, removeAnnotations, removeAssignees, removeStageHistory } = body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Task IDs are required'
      })
    }

    if (!newStatus) {
      throw createError({
        statusCode: 400,
        message: 'New status is required'
      })
    }

    console.log(`🔄 Bulk status change: ${taskIds.length} tasks to ${newStatus}`)
    console.log(`   Options: annotations=${removeAnnotations}, assignees=${removeAssignees}, history=${removeStageHistory}`)

    // Process each task
    const results = await Promise.all(
      taskIds.map(async (taskId) => {
        try {
          // 1. Remove annotations if requested
          if (removeAnnotations) {
            await prisma.annotation.deleteMany({
              where: { taskId }
            })
            console.log(`   🗑️ Removed annotations for task ${taskId}`)
          }

          // 2. Remove assignees if requested
          if (removeAssignees) {
            await prisma.task.update({
              where: { id: taskId },
              data: { assignedTo: null }
            })
            console.log(`   👤 Removed assignee for task ${taskId}`)
          }

          // 3. Remove stage history if requested
          // Reset timestamps to clear stage history
          if (removeStageHistory) {
            // Use raw SQL to set fields to NULL (Prisma doesn't support setting optional dates to null directly)
            await prisma.$executeRaw`
              UPDATE "Task" 
              SET "queuedAt" = NULL, "assignedAt" = NULL, "startedAt" = NULL, "completedAt" = NULL
              WHERE "id" = ${taskId}
            `
            console.log(`   📜 Reset stage history for task ${taskId}`)
          }

          // 4. Update task status using the service (handles queue management)
          await transitionTaskStatus(taskId, newStatus)
          
          return { taskId, success: true }
        } catch (error) {
          console.error(`   ❌ Failed to update task ${taskId}:`, error)
          return { taskId, success: false, error }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`✅ Bulk update complete: ${successCount} succeeded, ${failCount} failed`)

    return {
      success: true,
      data: {
        total: taskIds.length,
        succeeded: successCount,
        failed: failCount,
        results
      },
      message: `Updated ${successCount} task(s) successfully`
    }
  } catch (error) {
    console.error('Error in bulk status change:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update task statuses'
    })
  }
})
