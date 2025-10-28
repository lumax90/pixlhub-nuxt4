import prisma from '../../../utils/prisma'
import { minioClient, MINIO_BUCKET } from '../../../utils/minio'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Export ID is required'
      })
    }

    const exportRecord = await prisma.export.findUnique({
      where: { id }
    })

    if (!exportRecord) {
      throw createError({
        statusCode: 404,
        message: 'Export not found'
      })
    }

    // Check if expired
    if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
      throw createError({
        statusCode: 410,
        message: 'Export has expired'
      })
    }

    // Generate new presigned URL
    const client = minioClient()
    const downloadUrl = await client.presignedGetObject(
      MINIO_BUCKET,
      exportRecord.fileUrl,
      60 * 60, // 1 hour
      {
        'response-content-disposition': `attachment; filename="${exportRecord.filename}"`
      }
    )

    return {
      success: true,
      data: {
        downloadUrl,
        filename: exportRecord.filename,
        size: exportRecord.fileSize
      }
    }
  } catch (error) {
    console.error('Error downloading export:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to download export'
    })
  }
})
