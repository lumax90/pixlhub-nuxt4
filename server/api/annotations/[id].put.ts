import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Annotation ID is required'
      })
    }

    const { data, labelId, status } = body
    
    const annotation = await prisma.annotation.update({
      where: { id },
      data: {
        ...(data && { data }),
        ...(labelId && { labelId }),
        ...(status && { status })
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
    console.error('Error updating annotation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update annotation'
    })
  }
})
