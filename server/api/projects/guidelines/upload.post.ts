import prisma from '../../../utils/prisma'
import { uploadToMinio, ensureBucket } from '../../../utils/minio'

export default defineEventHandler(async (event) => {
  try {
    console.log('📄 Guidelines PDF upload request received')
    
    // Ensure MinIO bucket exists
    await ensureBucket()
    
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }

    const projectId = formData.find(item => item.name === 'projectId')?.data.toString()
    const fileItem = formData.find(item => item.name === 'file')
    
    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    if (!fileItem || !fileItem.filename) {
      throw createError({
        statusCode: 400,
        message: 'PDF file is required'
      })
    }

    // Upload PDF to MinIO
    const pdfUrl = await uploadToMinio(
      Buffer.from(fileItem.data),
      `guidelines-${fileItem.filename}`,
      projectId,
      'application/pdf'
    )

    console.log('✅ PDF uploaded:', pdfUrl)

    // Get current project to preserve existing metadata
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    // Update project metadata with PDF URL
    await prisma.project.update({
      where: { id: projectId },
      data: {
        metadata: {
          ...(currentProject?.metadata as any || {}),
          guidelinesPdfUrl: pdfUrl
        } as any
      }
    })

    console.log('✅ Project metadata updated')

    return {
      success: true,
      url: pdfUrl,
      message: 'Guidelines PDF uploaded successfully'
    }
  } catch (error) {
    console.error('Guidelines upload error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload guidelines PDF'
    })
  }
})
