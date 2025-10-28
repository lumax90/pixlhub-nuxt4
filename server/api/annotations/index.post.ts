import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Handle batch annotations (array)
    if (body.annotations && Array.isArray(body.annotations)) {
      const { taskId, annotations } = body
      
      if (!taskId) {
        throw createError({
          statusCode: 400,
          message: 'Missing required field: taskId'
        })
      }

      // Delete existing annotations for this task (upsert behavior)
      await prisma.annotation.deleteMany({
        where: { taskId }
      })

      // Create all annotations in a transaction (if any)
      let createdAnnotations = []
      if (annotations.length > 0) {
        createdAnnotations = await prisma.$transaction(
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
      }

      return {
        success: true,
        data: {
          taskId,
          count: createdAnnotations.length,
          annotations: createdAnnotations
        }
      }
    }
    
    // Handle single annotation (legacy support)
    const { taskId, labelId, type, data } = body
    
    if (!taskId || !labelId || !type || !data) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: taskId, labelId, type, data'
      })
    }

    const annotation = await prisma.annotation.create({
      data: {
        taskId,
        labelId,
        type,
        data,
        status: 'pending'
      },
      include: {
        label: true
      }
    })

    return {
      success: true,
      data: annotation
    }
  } catch (error) {
    console.error('Error creating annotation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create annotation'
    })
  }
})
