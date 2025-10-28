import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { taskId, preferred, rating, feedback, responseA, responseB } = body

    if (!taskId || !preferred) {
      throw createError({
        statusCode: 400,
        message: 'Task ID and preferred response are required'
      })
    }

    // Delete existing RLHF annotation for this task
    await prisma.annotation.deleteMany({
      where: { taskId }
    })

    // Create RLHF ranking annotation
    const annotation = await prisma.annotation.create({
      data: {
        taskId,
        labelId: 'rlhf-ranking', // Special label for RLHF
        type: 'rlhf-ranking',
        data: {
          preferred, // 'A' or 'B'
          rating: rating || 0, // 1-5 stars
          feedback: feedback || '',
          responseA: responseA || null,
          responseB: responseB || null,
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Saved RLHF ranking for task ${taskId}: Response ${preferred} preferred`)

    return {
      success: true,
      data: annotation,
      message: 'RLHF ranking saved successfully'
    }
  } catch (error) {
    console.error('Error saving RLHF ranking:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save RLHF ranking'
    })
  }
})
