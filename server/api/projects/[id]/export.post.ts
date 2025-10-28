import { exportToJSON, exportToCOCO, exportToYOLO, exportToYOLOv8Seg, exportToPascalVOC, exportToCSV } from '../../../services/exportService'
import type { ExportFormat, ExportOptions } from '../../../services/exportService'
// @ts-ignore
import AdmZip from 'adm-zip'
import { minioClient, MINIO_BUCKET } from '../../../utils/minio'
import prisma from '../../../utils/prisma'
import { notifyExportReady } from '../../../services/notificationService'

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

    const format: ExportFormat = body.format || 'json'
    const options: ExportOptions = body.options || {}

    // Validate format
    const validFormats: ExportFormat[] = ['json', 'coco', 'yolo', 'yolov8-seg', 'pascal-voc', 'csv', 'custom']
    if (!validFormats.includes(format)) {
      throw createError({
        statusCode: 400,
        message: `Invalid export format: ${format}. Supported formats: ${validFormats.join(', ')}`
      })
    }

    // Get project to validate format compatibility
    const projectInfo = await prisma.project.findUnique({
      where: { id },
      select: { toolType: true, name: true }
    })

    if (!projectInfo) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      })
    }

    // Validate format compatibility with project type
    const imageFormats: ExportFormat[] = ['coco', 'yolo', 'yolov8-seg', 'pascal-voc']
    if (imageFormats.includes(format) && projectInfo.toolType !== 'image') {
      throw createError({
        statusCode: 400,
        message: `Format ${format} is only supported for image projects. This is a ${projectInfo.toolType} project.`
      })
    }

    console.log(`📦 Exporting project ${id} (${projectInfo.toolType}) to ${format} format`)

    let exportData: any
    let filename = `export_${id}_${Date.now()}`

    // Generate export based on format
    switch (format) {
      case 'json':
        exportData = await exportToJSON(id, options)
        filename += '.json'
        break
      
      case 'coco':
        exportData = await exportToCOCO(id, options)
        filename += '_coco.json'
        break
      
      case 'yolo':
        exportData = await exportToYOLO(id, options)
        filename += '_yolo.zip'
        break
      
      case 'yolov8-seg':
        exportData = await exportToYOLOv8Seg(id, options)
        filename += '_yolov8seg.zip'
        break
      
      case 'pascal-voc':
        exportData = await exportToPascalVOC(id, options)
        filename += '_pascalvoc.zip'
        break
      
      case 'csv':
        exportData = await exportToCSV(id, options)
        filename += '.csv'
        break
      
      default:
        throw createError({
          statusCode: 400,
          message: 'Unsupported export format'
        })
    }

    // Create ZIP for multi-file formats
    let fileBuffer: Buffer
    let contentType: string

    if (format === 'yolo' || format === 'yolov8-seg' || format === 'pascal-voc') {
      const zip = new AdmZip()
      
      // Add all files to ZIP
      Object.entries(exportData.files).forEach(([name, content]) => {
        zip.addFile(name, Buffer.from(content as string, 'utf-8'))
      })
      
      fileBuffer = zip.toBuffer()
      contentType = 'application/zip'
    } else if (format === 'csv') {
      fileBuffer = Buffer.from(exportData, 'utf-8')
      contentType = 'text/csv'
    } else {
      // JSON formats
      fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8')
      contentType = 'application/json'
    }

    // Upload to MinIO
    const objectName = `exports/${id}/${filename}`
    const client = minioClient()
    
    await client.putObject(
      MINIO_BUCKET,
      objectName,
      fileBuffer,
      fileBuffer.length,
      {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    )

    // Generate presigned URL for download (valid for 1 hour)
    const downloadUrl = await client.presignedGetObject(
      MINIO_BUCKET,
      objectName,
      60 * 60, // 1 hour
      {
        'response-content-disposition': `attachment; filename="${filename}"`
      }
    )

    console.log(`✅ Export saved to MinIO: ${objectName}`)

    // Get latest version number for this project and format
    const latestExport = await prisma.export.findFirst({
      where: { projectId: id, format },
      orderBy: { version: 'desc' }
    })
    const version = (latestExport?.version || 0) + 1

    // Count tasks and annotations in export
    const taskCount = Array.isArray(exportData) ? exportData.length : 
                      exportData.tasks?.length || 
                      exportData.images?.length || 0
    const annotationCount = Array.isArray(exportData) ? 
                            exportData.reduce((sum: number, t: any) => sum + (t.annotations?.length || 0), 0) :
                            exportData.tasks?.reduce((sum: number, t: any) => sum + (t.annotations?.length || 0), 0) ||
                            exportData.annotations?.length || 0

    // Save export history
    const exportRecord = await prisma.export.create({
      data: {
        projectId: id,
        format,
        version,
        filename,
        fileUrl: objectName,
        fileSize: fileBuffer.length,
        options: options as any, // Cast to any for JSON field
        customTemplate: body.customTemplate || null,
        dateRangeStart: body.dateRangeStart || null,
        dateRangeEnd: body.dateRangeEnd || null,
        statusFilter: options.includeNonReviewed ? 'all' : 'completed',
        taskCount,
        annotationCount,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    })

    // Get project details for notification
    const project = await prisma.project.findUnique({
      where: { id }
    })

    // Send notification that export is ready
    if (project) {
      await notifyExportReady(
        'demo-user', // TODO: Get actual user ID
        id,
        project.name,
        format
      )
    }

    return {
      success: true,
      data: {
        exportId: exportRecord.id,
        filename,
        downloadUrl,
        format,
        version,
        size: fileBuffer.length,
        taskCount,
        annotationCount
      }
    }
  } catch (error) {
    console.error('Export error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to export annotations'
    })
  }
})
