import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Label ID is required'
      })
    }

    await prisma.label.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Label deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting label:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete label'
    })
  }
})
