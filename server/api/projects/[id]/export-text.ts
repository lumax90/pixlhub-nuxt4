import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const projectId = getRouterParam(event, 'id')
    
    // Support both GET (query params) and POST (body)
    const query = getQuery(event)
    let format: string
    let includeNonReviewed: boolean
    
    if (event.method === 'GET') {
      format = (query.format as string) || 'json'
      includeNonReviewed = query.includeNonReviewed === 'true'
    } else {
      const body = await readBody(event)
      format = body.format
      includeNonReviewed = body.includeNonReviewed
    }

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        toolType: true,
        annotationType: true
      }
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      })
    }

    // Determine status filter
    const statusFilter = includeNonReviewed 
      ? ['label', 'review', 'completed']
      : ['completed']

    // Get tasks with annotations
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        status: { in: statusFilter }
      },
      include: {
        asset: true,
        annotations: {
          include: {
            label: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    let exportData: any
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'json':
        exportData = exportTextToJSON(project, tasks)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      
      case 'csv':
        exportData = exportTextToCSV(project, tasks)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      
      case 'jsonl':
        exportData = exportTextToJSONL(project, tasks)
        contentType = 'application/x-ndjson'
        fileExtension = 'jsonl'
        break
      
      case 'spacy':
        exportData = exportTextToSpacy(project, tasks)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      
      default:
        throw createError({
          statusCode: 400,
          message: 'Invalid export format'
        })
    }

    // Set headers
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${project.name.replace(/\s+/g, '_')}_${timestamp}.${fileExtension}`
    
    event.node.res.setHeader('Content-Type', contentType)
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    return exportData
  } catch (error) {
    console.error('Text export error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to export text annotations'
    })
  }
})

// Export to JSON
function exportTextToJSON(project: any, tasks: any[]) {
  const annotations = tasks.map(task => {
    const asset = task.asset
    const anns = task.annotations

    if (anns.length === 0) return null

    const annotationType = anns[0].type

    if (annotationType === 'text-span') {
      // NER
      return {
        taskId: task.id,
        assetId: asset.id,
        assetName: asset.name,
        text: asset.content || '',
        annotationType: 'ner',
        entities: anns.map((ann: any) => ({
          text: ann.data.text,
          label: ann.label.name,
          labelId: ann.labelId,
          start: ann.data.start,
          end: ann.data.end
        }))
      }
    } else if (annotationType === 'sentiment') {
      return {
        taskId: task.id,
        assetId: asset.id,
        assetName: asset.name,
        text: asset.content || '',
        annotationType: 'sentiment',
        sentiment: anns[0].data.sentiment
      }
    } else if (annotationType === 'classification') {
      return {
        taskId: task.id,
        assetId: asset.id,
        assetName: asset.name,
        text: asset.content || '',
        annotationType: 'classification',
        labels: anns.map((ann: any) => ({
          labelId: ann.labelId,
          labelName: ann.label.name
        }))
      }
    } else if (annotationType === 'emotion') {
      return {
        taskId: task.id,
        assetId: asset.id,
        assetName: asset.name,
        text: asset.content || '',
        annotationType: 'emotion',
        emotion: anns[0].data.emotion,
        intensity: anns[0].data.intensity
      }
    } else if (annotationType === 'rlhf-ranking') {
      return {
        taskId: task.id,
        assetId: asset.id,
        assetName: asset.name,
        annotationType: 'rlhf',
        preferred: anns[0].data.preferred,
        rating: anns[0].data.rating,
        feedback: anns[0].data.feedback,
        responseA: anns[0].data.responseA,
        responseB: anns[0].data.responseB
      }
    }

    return null
  }).filter(Boolean)

  return {
    project: {
      id: project.id,
      name: project.name,
      toolType: project.toolType,
      annotationType: project.annotationType
    },
    exportDate: new Date().toISOString(),
    totalTasks: tasks.length,
    totalAnnotations: annotations.length,
    annotations
  }
}

// Export to CSV
function exportTextToCSV(project: any, tasks: any[]) {
  const rows: string[] = []
  
  if (tasks.length === 0) {
    return 'No data to export'
  }

  const firstAnnotationType = tasks.find(t => t.annotations.length > 0)?.annotations[0]?.type

  if (firstAnnotationType === 'text-span') {
    // NER
    rows.push('asset_name,text,entity_text,label,start,end')
    tasks.forEach(task => {
      const text = task.asset.content || ''
      task.annotations.forEach((ann: any) => {
        rows.push(`"${task.asset.name}","${escapeCsv(text)}","${escapeCsv(ann.data.text)}","${ann.label.name}",${ann.data.start},${ann.data.end}`)
      })
    })
  } else if (firstAnnotationType === 'sentiment') {
    rows.push('asset_name,text,sentiment')
    tasks.forEach(task => {
      const text = task.asset.content || ''
      const sentiment = task.annotations[0]?.data?.sentiment || ''
      rows.push(`"${task.asset.name}","${escapeCsv(text)}","${sentiment}"`)
    })
  } else if (firstAnnotationType === 'classification') {
    rows.push('asset_name,text,labels')
    tasks.forEach(task => {
      const text = task.asset.content || ''
      const labels = task.annotations.map((ann: any) => ann.label.name).join(';')
      rows.push(`"${task.asset.name}","${escapeCsv(text)}","${labels}"`)
    })
  } else if (firstAnnotationType === 'emotion') {
    rows.push('asset_name,text,emotion,intensity')
    tasks.forEach(task => {
      const text = task.asset.content || ''
      const emotion = task.annotations[0]?.data?.emotion || ''
      const intensity = task.annotations[0]?.data?.intensity || 0
      rows.push(`"${task.asset.name}","${escapeCsv(text)}","${emotion}",${intensity}`)
    })
  } else if (firstAnnotationType === 'rlhf-ranking') {
    rows.push('asset_name,preferred,rating,feedback')
    tasks.forEach(task => {
      const annData = task.annotations[0]?.data
      rows.push(`"${task.asset.name}","${annData.preferred}",${annData.rating},"${escapeCsv(annData.feedback || '')}"`)
    })
  }

  return rows.join('\n')
}

// Export to JSONL (ML training format)
function exportTextToJSONL(project: any, tasks: any[]) {
  const lines: string[] = []

  tasks.forEach(task => {
    if (task.annotations.length === 0) return

    const text = task.asset.content || ''
    const annotationType = task.annotations[0].type

    if (annotationType === 'text-span') {
      // NER - SpaCy format
      const entities = task.annotations.map((ann: any) => [
        ann.data.start,
        ann.data.end,
        ann.label.name
      ])
      lines.push(JSON.stringify({ text, entities }))
    } else if (annotationType === 'sentiment') {
      lines.push(JSON.stringify({ 
        text, 
        sentiment: task.annotations[0].data.sentiment 
      }))
    } else if (annotationType === 'classification') {
      const labels = task.annotations.map((ann: any) => ann.label.name)
      lines.push(JSON.stringify({ text, labels }))
    } else if (annotationType === 'emotion') {
      lines.push(JSON.stringify({ 
        text, 
        emotion: task.annotations[0].data.emotion,
        intensity: task.annotations[0].data.intensity
      }))
    } else if (annotationType === 'rlhf-ranking') {
      const annData = task.annotations[0].data
      lines.push(JSON.stringify({ 
        preferred: annData.preferred,
        rating: annData.rating,
        feedback: annData.feedback
      }))
    }
  })

  return lines.join('\n')
}

// Export to SpaCy format (NER only)
function exportTextToSpacy(project: any, tasks: any[]) {
  const training_data: any[] = []

  tasks.forEach(task => {
    if (task.annotations.length === 0) return
    if (task.annotations[0].type !== 'text-span') return

    const text = task.asset.content || ''
    const entities = task.annotations.map((ann: any) => [
      ann.data.start,
      ann.data.end,
      ann.label.name
    ])

    training_data.push([text, { entities }])
  })

  return training_data
}

function escapeCsv(text: string): string {
  if (!text) return ''
  return text.replace(/"/g, '""')
}
