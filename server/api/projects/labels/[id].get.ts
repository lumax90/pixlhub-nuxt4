import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')
  
  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: 'Project ID is required'
    })
  }

  try {
    // Get project to determine toolType
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        labels: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      })
    }

    // Convert labels to label schema format
    const labelSchema = {
      id: `schema_${projectId}`,
      projectId,
      toolType: project.toolType,
      classes: project.labels.map(label => ({
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description,
        shortcut: label.shortcut,
        order: label.order,
        attributes: label.attributes as any || []
      })),
      version: 1,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }

    return {
      success: true,
      data: labelSchema
    }
  } catch (error) {
    console.error('Error loading label schema:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load label schema'
    })
  }
})
