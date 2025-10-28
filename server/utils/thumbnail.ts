import sharp from 'sharp'

export interface ThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

/**
 * Generate a thumbnail from an image buffer
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  options: ThumbnailOptions = {}
): Promise<Buffer> {
  const {
    width = 300,
    height = 300,
    quality = 80,
    fit = 'cover'
  } = options

  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(width, height, { fit })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

    return thumbnail
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    throw error
  }
}

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    }
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    return { width: 0, height: 0 }
  }
}
