import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: 'Project ID is required'
    })
  }

  if (!body.classes || !Array.isArray(body.classes)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid label schema data'
    })
  }

  try {
    // Get existing labels
    const existingLabels = await prisma.label.findMany({
      where: { projectId }
    })

    // Create a map of existing labels by ID
    const existingLabelMap = new Map(existingLabels.map(l => [l.id, l]))
    
    // Track which labels to keep
    const incomingLabelIds = new Set(body.classes.map((cls: any) => cls.id).filter(Boolean))
    
    // Delete labels that are no longer in the schema (only if they have no annotations)
    const labelsToDelete = existingLabels.filter(l => !incomingLabelIds.has(l.id))
    for (const label of labelsToDelete) {
      // Check if label has annotations
      const annotationCount = await prisma.annotation.count({
        where: { labelId: label.id }
      })
      
      if (annotationCount === 0) {
        // Safe to delete - no annotations
        await prisma.label.delete({ where: { id: label.id } })
      } else {
        // Keep the label but mark it as archived in metadata
        console.warn(`⚠️ Cannot delete label "${label.name}" - has ${annotationCount} annotations`)
      }
    }

    // Update or create labels
    const createdLabels = await Promise.all(
      body.classes.map(async (cls: any) => {
        if (cls.id && existingLabelMap.has(cls.id)) {
          // Update existing label
          return await prisma.label.update({
            where: { id: cls.id },
            data: {
              name: cls.name,
              color: cls.color,
              description: cls.description || null,
              shortcut: cls.shortcut || null,
              order: cls.order || 0,
              attributes: cls.attributes || []
            }
          })
        } else {
          // Create new label
          return await prisma.label.create({
            data: {
              projectId,
              name: cls.name,
              color: cls.color,
              description: cls.description || null,
              shortcut: cls.shortcut || null,
              order: cls.order || 0,
              attributes: cls.attributes || []
            }
          })
        }
      })
    )

    console.log('✅ Label schema saved for project:', projectId, {
      classesCount: createdLabels.length,
      version: (body.version || 0) + 1
    })

    // Return in the expected format
    return {
      success: true,
      data: {
        id: `schema_${projectId}`,
        projectId,
        toolType: body.toolType || 'image',
        classes: createdLabels.map(label => ({
          id: label.id,
          name: label.name,
          color: label.color,
          description: label.description,
          shortcut: label.shortcut,
          order: label.order,
          attributes: label.attributes as any || []
        })),
        version: (body.version || 0) + 1,
        updatedAt: new Date()
      },
      message: 'Label schema saved successfully'
    }
  } catch (error) {
    console.error('Error saving label schema:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save label schema'
    })
  }
})
