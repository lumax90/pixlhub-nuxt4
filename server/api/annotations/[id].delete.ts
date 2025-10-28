import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Annotation ID is required'
      })
    }

    await prisma.annotation.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Annotation deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting annotation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete annotation'
    })
  }
})
