import { exportToJSON, exportToCOCO, exportToYOLO, exportToYOLOv8Seg, exportToPascalVOC, exportToCSV } from '../../../services/exportService'
import type { ExportFormat, ExportOptions } from '../../../services/exportService'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    const format = body.format as ExportFormat
    const options = body.options as ExportOptions
    const limit = body.limit || 3 // Default to 3 items for preview

    if (!format) {
      throw createError({
        statusCode: 400,
        message: 'Export format is required'
      })
    }

    console.log(`📋 Generating preview for project ${id} in ${format} format (limit: ${limit})`)

    // Generate preview data based on format
    let previewData: any

    switch (format) {
      case 'json':
        previewData = await exportToJSON(id, { ...options, limit })
        break
      case 'coco':
        previewData = await exportToCOCO(id, { ...options, limit })
        break
      case 'yolo':
        previewData = await exportToYOLO(id, { ...options, limit })
        break
      case 'yolov8-seg':
        previewData = await exportToYOLOv8Seg(id, { ...options, limit })
        break
      case 'pascal-voc':
        previewData = await exportToPascalVOC(id, { ...options, limit })
        break
      case 'csv':
        previewData = await exportToCSV(id, { ...options, limit })
        break
      case 'custom':
        // For custom templates, use JSON format as base
        previewData = await exportToJSON(id, { ...options, limit })
        break
      default:
        throw createError({
          statusCode: 400,
          message: `Unsupported format: ${format}`
        })
    }

    // Limit the preview data
    if (Array.isArray(previewData)) {
      previewData = previewData.slice(0, limit)
    } else if (previewData.tasks) {
      previewData.tasks = previewData.tasks.slice(0, limit)
    } else if (previewData.images) {
      previewData.images = previewData.images.slice(0, limit)
      if (previewData.annotations) {
        // Keep only annotations for preview images
        const imageIds = previewData.images.map((img: any) => img.id)
        previewData.annotations = previewData.annotations.filter((ann: any) => 
          imageIds.includes(ann.image_id)
        )
      }
    }

    return {
      success: true,
      data: previewData
    }
  } catch (error) {
    console.error('Preview error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate preview'
    })
  }
})
