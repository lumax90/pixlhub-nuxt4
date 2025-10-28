import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { taskId, annotations } = body

    if (!taskId || !annotations || !Array.isArray(annotations)) {
      throw createError({
        statusCode: 400,
        message: 'Task ID and annotations array are required'
      })
    }

    // Delete existing annotations for this task
    await prisma.annotation.deleteMany({
      where: { taskId }
    })

    // Create new annotations
    const createdAnnotations = await Promise.all(
      annotations.map((ann: any) =>
        prisma.annotation.create({
          data: {
            taskId,
            labelId: ann.labelId,
            type: ann.type,
            data: ann.data,
            status: 'pending'
          }
        })
      )
    )

    return {
      success: true,
      data: createdAnnotations,
      message: 'Annotations saved successfully'
    }
  } catch (error) {
    console.error('Error saving annotations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save annotations'
    })
  }
})
