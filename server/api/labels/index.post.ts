import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { projectId, name, color, description, shortcut } = body
    
    if (!projectId || !name || !color) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: projectId, name, color'
      })
    }

    const label = await prisma.label.create({
      data: {
        projectId,
        name,
        color,
        description,
        shortcut
      }
    })

    return {
      success: true,
      data: label
    }
  } catch (error: any) {
    console.error('Error creating label:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Label with this name already exists in the project'
      })
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to create label'
    })
  }
})
