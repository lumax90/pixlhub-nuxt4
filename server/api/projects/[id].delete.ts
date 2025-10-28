import prisma from '../../utils/prisma'
import { deleteFromMinio } from '../../utils/minio'

export default defineEventHandler(async (event) => {
  try {
    const projectId = getRouterParam(event, 'id')

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    console.log(`🗑️  Deleting project: ${projectId}`)

    // Get all assets to delete from MinIO
    const assets = await prisma.asset.findMany({
      where: { projectId }
    })

    console.log(`📦 Found ${assets.length} assets to delete`)

    // Delete all files from MinIO (originals and thumbnails)
    for (const asset of assets) {
      try {
        // Extract object name from URL
        const url = new URL(asset.url)
        const objectName = url.pathname.split('/').slice(2).join('/') // Remove /bucket-name/
        
        console.log(`🗑️  Deleting from MinIO: ${objectName}`)
        await deleteFromMinio(objectName)

        // Delete thumbnail if exists
        if (asset.metadata && typeof asset.metadata === 'object' && 'thumbnailUrl' in asset.metadata) {
          const thumbnailUrl = (asset.metadata as any).thumbnailUrl
          if (thumbnailUrl) {
            const thumbUrl = new URL(thumbnailUrl)
            const thumbObjectName = thumbUrl.pathname.split('/').slice(2).join('/')
            console.log(`🗑️  Deleting thumbnail: ${thumbObjectName}`)
            await deleteFromMinio(thumbObjectName)
          }
        }
      } catch (error) {
        console.error(`Failed to delete file from MinIO:`, error)
        // Continue even if file deletion fails
      }
    }

    // Delete project and all related data (cascade will handle tasks, annotations, etc.)
    await prisma.project.delete({
      where: { id: projectId }
    })

    console.log(`✅ Project deleted successfully: ${projectId}`)

    return {
      success: true,
      message: 'Project and all related data deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting project:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete project'
    })
  }
})
