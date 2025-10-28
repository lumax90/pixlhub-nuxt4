import prisma from '../utils/prisma'
import { uploadToMinio, uploadThumbnailToMinio, ensureBucket } from '../utils/minio'
import { generateThumbnail, getImageDimensions } from '../utils/thumbnail'
import { detectAssetType, validateFileType } from '../utils/assetType'
import type { AssetType } from '../utils/assetType'

export default defineEventHandler(async (event) => {
  try {
    console.log('📤 Upload request received')
    
    // Ensure MinIO bucket exists
    try {
      await ensureBucket()
      console.log('✅ MinIO bucket ready')
    } catch (minioError) {
      console.error('❌ MinIO connection error:', minioError)
      throw createError({
        statusCode: 500,
        message: 'MinIO storage not available. Please check if MinIO is running.'
      })
    }
    
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        message: 'No files uploaded'
      })
    }

    const projectId = formData.find(item => item.name === 'projectId')?.data.toString()
    const batchName = formData.find(item => item.name === 'batchName')?.data.toString()
    
    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // Get project to validate file types
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      })
    }

    const uploadedTasks = []
    const renamedFiles: { original: string; renamed: string }[] = []
    const invalidFiles: { filename: string; reason: string }[] = []

    // Helper function to generate unique filename
    const getUniqueFilename = async (filename: string, projectId: string): Promise<string> => {
      const existingAsset = await prisma.asset.findFirst({
        where: { projectId, name: filename }
      })

      if (!existingAsset) {
        return filename
      }

      // File exists, generate new name with _copy suffix
      const lastDotIndex = filename.lastIndexOf('.')
      const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
      const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : ''

      let counter = 1
      let newFilename = `${nameWithoutExt}_copy${extension}`

      // Keep incrementing until we find a unique name
      while (await prisma.asset.findFirst({ where: { projectId, name: newFilename } })) {
        counter++
        newFilename = `${nameWithoutExt}_copy${counter}${extension}`
      }

      return newFilename
    }

    // Process each file
    for (const item of formData) {
      if (item.name === 'files' && item.filename) {
        // Get unique filename (auto-rename if duplicate)
        const originalFilename = item.filename
        const uniqueFilename = await getUniqueFilename(originalFilename, projectId)

        if (uniqueFilename !== originalFilename) {
          console.log(`📝 Renamed duplicate: ${originalFilename} → ${uniqueFilename}`)
          renamedFiles.push({
            original: originalFilename,
            renamed: uniqueFilename
          })
        }

        // Detect asset type
        const assetTypeInfo = detectAssetType(uniqueFilename, item.type)
        console.log(`🔍 Detected asset type: ${assetTypeInfo.type} for ${uniqueFilename}`)

        // Validate file type matches project
        if (!validateFileType(assetTypeInfo.type, project.toolType)) {
          console.warn(`⚠️ Invalid file type: ${assetTypeInfo.type} for project type ${project.toolType}`)
          invalidFiles.push({
            filename: originalFilename,
            reason: `File type '${assetTypeInfo.type}' not supported for '${project.toolType}' projects`
          })
          continue
        }

        // Determine content type
        const contentType = item.type || 'application/octet-stream'
        const fileBuffer = Buffer.from(item.data)
        
        let assetUrl: string
        let thumbnailUrl: string | null = null
        let dimensions: { width: number; height: number } | null = null
        let textContent: string | null = null

        // Process based on asset type
        if (assetTypeInfo.type === 'image') {
          // Image processing
          dimensions = await getImageDimensions(fileBuffer)
          console.log(`📐 Image dimensions: ${dimensions.width}x${dimensions.height}`)
          
          // Generate thumbnail
          console.log('🖼️  Generating thumbnail...')
          const thumbnailBuffer = await generateThumbnail(fileBuffer, {
            width: 300,
            height: 300,
            quality: 85
          })
          console.log(`✅ Thumbnail generated: ${thumbnailBuffer.length} bytes`)
          
          // Upload original and thumbnail
          assetUrl = await uploadToMinio(fileBuffer, uniqueFilename, projectId, contentType)
          thumbnailUrl = await uploadThumbnailToMinio(thumbnailBuffer, uniqueFilename, projectId)
          console.log(`✅ Thumbnail uploaded: ${thumbnailUrl}`)
        } 
        else if (assetTypeInfo.type === 'text' || assetTypeInfo.type === 'rlhf') {
          // Text/RLHF processing - store content directly
          textContent = fileBuffer.toString('utf-8')
          console.log(`📝 Text content extracted: ${textContent.length} characters`)
          
          // Still upload to MinIO for backup
          assetUrl = await uploadToMinio(fileBuffer, uniqueFilename, projectId, contentType)
        }
        else {
          // Other types (audio, video, document) - just upload
          assetUrl = await uploadToMinio(fileBuffer, uniqueFilename, projectId, contentType)
          console.log(`✅ File uploaded: ${assetUrl}`)
        }
        
        // Create asset in database (use unique filename)
        const asset = await prisma.asset.create({
          data: {
            name: uniqueFilename,
            type: assetTypeInfo.type,
            url: assetUrl,
            projectId,
            content: textContent, // Store text content directly for text/RLHF
            metadata: {
              originalName: originalFilename,
              size: item.data.length,
              uploadedAt: new Date().toISOString(),
              batchName: batchName || null,
              batchId: batchName ? `batch_${Date.now()}` : null,
              thumbnailUrl: thumbnailUrl || null,
              width: dimensions?.width || null,
              height: dimensions?.height || null,
              assetType: assetTypeInfo.type,
              contentType: contentType
            }
          }
        })

        // Auto-create task with "label" status
        const { createTaskFromAsset } = await import('../services/taskService')
        const task = await createTaskFromAsset(asset.id, projectId, 'label')

        uploadedTasks.push({ asset, task })
      }
    }

    // Update project task count
    await prisma.project.update({
      where: { id: projectId },
      data: {
        totalTasks: {
          increment: uploadedTasks.length
        }
      }
    })

    // Build response message
    let message = `Uploaded ${uploadedTasks.length} file(s) successfully`
    if (renamedFiles.length > 0) {
      message += `. ${renamedFiles.length} file(s) auto-renamed`
    }
    if (invalidFiles.length > 0) {
      message += `. ${invalidFiles.length} file(s) skipped (invalid type)`
    }

    return {
      success: true,
      data: uploadedTasks,
      renamed: renamedFiles,
      invalid: invalidFiles,
      message
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload files'
    })
  }
})
