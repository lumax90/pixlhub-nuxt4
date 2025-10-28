import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { taskId, annotations, annotationType } = body

    if (!taskId || !annotations) {
      throw createError({
        statusCode: 400,
        message: 'Task ID and annotations are required'
      })
    }

    // Delete existing annotations for this task
    await prisma.annotation.deleteMany({
      where: { taskId }
    })

    // Create new annotations based on type
    const createdAnnotations = []

    if (annotationType === 'ner') {
      // NER: Text spans with labels
      for (const span of annotations) {
        const annotation = await prisma.annotation.create({
          data: {
            taskId,
            labelId: span.labelId,
            type: 'text-span',
            data: {
              start: span.start,
              end: span.end,
              text: span.text
            }
          }
        })
        createdAnnotations.push(annotation)
      }
    } else if (annotationType === 'sentiment') {
      // Sentiment: Single classification
      const annotation = await prisma.annotation.create({
        data: {
          taskId,
          labelId: annotations.labelId || 'sentiment',
          type: 'sentiment',
          data: {
            sentiment: annotations.sentiment
          }
        }
      })
      createdAnnotations.push(annotation)
    } else if (annotationType === 'classification') {
      // Classification: Multiple labels
      for (const labelId of annotations.labels) {
        const annotation = await prisma.annotation.create({
          data: {
            taskId,
            labelId,
            type: 'classification',
            data: {
              selected: true
            }
          }
        })
        createdAnnotations.push(annotation)
      }
    } else if (annotationType === 'emotion') {
      // Emotion: Emotion + intensity
      const annotation = await prisma.annotation.create({
        data: {
          taskId,
          labelId: 'emotion',
          type: 'emotion',
          data: {
            emotion: annotations.emotion,
            intensity: annotations.intensity
          }
        }
      })
      createdAnnotations.push(annotation)
    }

    console.log(`✅ Saved ${createdAnnotations.length} text annotations for task ${taskId}`)

    return {
      success: true,
      data: createdAnnotations,
      message: `Saved ${createdAnnotations.length} annotation(s)`
    }
  } catch (error) {
    console.error('Error saving text annotations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save text annotations'
    })
  }
})
