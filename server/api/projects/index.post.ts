import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { name, description, toolType, annotationType } = body
    
    if (!name || !toolType || !annotationType) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: name, toolType, annotationType'
      })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        toolType,
        annotationType,
        status: 'active'
      }
    })

    return {
      success: true,
      data: project
    }
  } catch (error) {
    console.error('Error creating project:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create project'
    })
  }
})
