import { Client } from 'minio'

// Initialize MinIO client lazily
let minioClient: Client | null = null
let BUCKET_NAME = 'pixlhub-assets'

function getMinioClient() {
  if (!minioClient) {
    const config = useRuntimeConfig()
    
    BUCKET_NAME = config.minioBucket || 'pixlhub-assets'
    
    minioClient = new Client({
      endPoint: config.minioEndpoint || 'localhost',
      port: parseInt(config.minioPort || '9000'),
      useSSL: config.minioUseSSL === 'true',
      accessKey: config.minioAccessKey || 'minioadmin',
      secretKey: config.minioSecretKey || 'minioadmin'
    })
    
    console.log('🔧 MinIO client initialized:', {
      endpoint: config.minioEndpoint || 'localhost',
      port: config.minioPort || '9000',
      bucket: BUCKET_NAME
    })
  }
  return minioClient
}

// Ensure bucket exists
export async function ensureBucket() {
  const client = getMinioClient()
  try {
    const exists = await client.bucketExists(BUCKET_NAME)
    if (!exists) {
      await client.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`✅ Created MinIO bucket: ${BUCKET_NAME}`)
      
      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      }
      await client.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
    }
  } catch (error) {
    console.error('MinIO bucket error:', error)
    throw error
  }
}

// Upload file to MinIO
export async function uploadToMinio(
  buffer: any,
  filename: string,
  projectId: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const client = getMinioClient()
  const objectName = `${projectId}/${Date.now()}-${filename}`
  
  await client.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
    'Content-Type': contentType
  })
  
  // Return public URL
  const config = useRuntimeConfig()
  const url = `${config.minioPublicUrl || 'http://localhost:9000'}/${BUCKET_NAME}/${objectName}`
  return url
}

// Upload thumbnail to MinIO
export async function uploadThumbnailToMinio(
  buffer: Buffer,
  filename: string,
  projectId: string
): Promise<string> {
  const client = getMinioClient()
  const thumbnailName = `${projectId}/thumbnails/${Date.now()}-thumb-${filename}`
  
  await client.putObject(BUCKET_NAME, thumbnailName, buffer, buffer.length, {
    'Content-Type': 'image/jpeg'
  })
  
  // Return public URL
  const config = useRuntimeConfig()
  const url = `${config.minioPublicUrl || 'http://localhost:9000'}/${BUCKET_NAME}/${thumbnailName}`
  return url
}

// Delete file from MinIO
export async function deleteFromMinio(objectName: string): Promise<void> {
  const client = getMinioClient()
  await client.removeObject(BUCKET_NAME, objectName)
}

// Get presigned URL for private access
export async function getPresignedUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
  const client = getMinioClient()
  return await client.presignedGetObject(BUCKET_NAME, objectName, expirySeconds)
}

export { getMinioClient as minioClient, BUCKET_NAME as MINIO_BUCKET }
export default getMinioClient
