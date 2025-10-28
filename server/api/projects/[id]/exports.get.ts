import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    const exports = await prisma.export.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 exports
    })

    return {
      success: true,
      data: exports
    }
  } catch (error) {
    console.error('Error fetching exports:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch exports'
    })
  }
})
