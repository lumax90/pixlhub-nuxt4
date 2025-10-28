import prisma from '../../../utils/prisma'

/**
 * DEPRECATED: This endpoint is deprecated. Use POST /api/projects/[id]/export instead.
 * Kept for backward compatibility only.
 * 
 * This endpoint redirects to the new unified export system.
 */
export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const format = (query.format as string) || 'json'

  console.warn('⚠️ Using deprecated GET export endpoint. Please use POST /api/projects/[id]/export')

  // Redirect to new export system with default options
  return {
    success: false,
    deprecated: true,
    message: 'This endpoint is deprecated. Please use POST /api/projects/[id]/export with proper format and options.',
    newEndpoint: `/api/projects/${projectId}/export`,
    suggestedPayload: {
      format,
      options: {
        includeMetadata: true,
        includeNonReviewed: false,
        includeReviewMetadata: false,
        splitDataset: false,
        trainSplit: 80,
        valSplit: 10,
        testSplit: 10
      }
    }
  }
})

function processAnnotations(project: any, format: string) {
  const annotations: any[] = []

  // Process each asset
  for (const asset of project.assets) {
    for (const task of asset.tasks) {
      if (task.annotations.length === 0) continue

      const annotationType = task.annotations[0].type

      if (annotationType === 'text-span') {
        // NER annotations
        const entities = task.annotations.map((ann: any) => ({
          text: ann.data.text,
          label: ann.label?.name || 'Unknown',
          labelId: ann.labelId,
          start: ann.data.start,
          end: ann.data.end
        }))

        annotations.push({
          assetId: asset.id,
          assetName: asset.name,
          text: asset.content || '',
          annotationType: 'ner',
          entities
        })
      } else if (annotationType === 'sentiment') {
        // Sentiment annotations
        annotations.push({
          assetId: asset.id,
          assetName: asset.name,
          text: asset.content || '',
          annotationType: 'sentiment',
          sentiment: task.annotations[0].data.sentiment
        })
      } else if (annotationType === 'classification') {
        // Classification annotations
        const labels = task.annotations.map((ann: any) => ({
          labelId: ann.labelId,
          labelName: ann.label?.name || 'Unknown'
        }))

        annotations.push({
          assetId: asset.id,
          assetName: asset.name,
          text: asset.content || '',
          annotationType: 'classification',
          labels
        })
      } else if (annotationType === 'emotion') {
        // Emotion annotations
        annotations.push({
          assetId: asset.id,
          assetName: asset.name,
          text: asset.content || '',
          annotationType: 'emotion',
          emotion: task.annotations[0].data.emotion,
          intensity: task.annotations[0].data.intensity
        })
      } else if (annotationType === 'rlhf-ranking') {
        // RLHF annotations
        annotations.push({
          assetId: asset.id,
          assetName: asset.name,
          annotationType: 'rlhf',
          preferred: task.annotations[0].data.preferred,
          rating: task.annotations[0].data.rating,
          feedback: task.annotations[0].data.feedback
        })
      }
    }
  }

  // Format output
  if (format === 'csv') {
    return formatAsCSV(annotations)
  } else if (format === 'jsonl') {
    return formatAsJSONL(annotations)
  } else if (format === 'spacy') {
    return formatAsSpacy(annotations)
  } else {
    return {
      project: {
        id: project.id,
        name: project.name,
        toolType: project.toolType,
        annotationType: project.annotationType
      },
      exportDate: new Date().toISOString(),
      totalAnnotations: annotations.length,
      annotations
    }
  }
}

function formatAsCSV(annotations: any[]): string {
  const rows: string[] = []

  // Determine CSV format based on annotation type
  const firstType = annotations[0]?.annotationType

  if (firstType === 'ner') {
    rows.push('asset_name,text,entity_text,label,start,end')
    for (const ann of annotations) {
      for (const entity of ann.entities) {
        rows.push(`"${ann.assetName}","${escapeCsv(ann.text)}","${escapeCsv(entity.text)}","${entity.label}",${entity.start},${entity.end}`)
      }
    }
  } else if (firstType === 'sentiment') {
    rows.push('asset_name,text,sentiment')
    for (const ann of annotations) {
      rows.push(`"${ann.assetName}","${escapeCsv(ann.text)}","${ann.sentiment}"`)
    }
  } else if (firstType === 'classification') {
    rows.push('asset_name,text,labels')
    for (const ann of annotations) {
      const labelNames = ann.labels.map((l: any) => l.labelName).join(';')
      rows.push(`"${ann.assetName}","${escapeCsv(ann.text)}","${labelNames}"`)
    }
  } else if (firstType === 'emotion') {
    rows.push('asset_name,text,emotion,intensity')
    for (const ann of annotations) {
      rows.push(`"${ann.assetName}","${escapeCsv(ann.text)}","${ann.emotion}",${ann.intensity}`)
    }
  } else if (firstType === 'rlhf') {
    rows.push('asset_name,preferred,rating,feedback')
    for (const ann of annotations) {
      rows.push(`"${ann.assetName}","${ann.preferred}",${ann.rating},"${escapeCsv(ann.feedback || '')}"`)
    }
  }

  return rows.join('\n')
}

function formatAsJSONL(annotations: any[]): string {
  const lines: string[] = []

  for (const ann of annotations) {
    if (ann.annotationType === 'ner') {
      // SpaCy-compatible format
      const entities = ann.entities.map((e: any) => [e.start, e.end, e.label])
      lines.push(JSON.stringify({ text: ann.text, entities }))
    } else if (ann.annotationType === 'sentiment') {
      lines.push(JSON.stringify({ text: ann.text, sentiment: ann.sentiment }))
    } else if (ann.annotationType === 'classification') {
      const labels = ann.labels.map((l: any) => l.labelName)
      lines.push(JSON.stringify({ text: ann.text, labels }))
    } else if (ann.annotationType === 'emotion') {
      lines.push(JSON.stringify({ text: ann.text, emotion: ann.emotion, intensity: ann.intensity }))
    } else if (ann.annotationType === 'rlhf') {
      lines.push(JSON.stringify({ 
        assetName: ann.assetName,
        preferred: ann.preferred, 
        rating: ann.rating, 
        feedback: ann.feedback 
      }))
    }
  }

  return lines.join('\n')
}

function formatAsSpacy(annotations: any[]): any {
  // SpaCy training format
  const training_data: any[] = []

  for (const ann of annotations) {
    if (ann.annotationType === 'ner') {
      const entities = ann.entities.map((e: any) => [e.start, e.end, e.label])
      training_data.push([ann.text, { entities }])
    }
  }

  return training_data
}

function escapeCsv(text: string): string {
  return text.replace(/"/g, '""')
}
