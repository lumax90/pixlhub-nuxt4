/**
 * Asset type detection utilities
 */

export type AssetType = 'image' | 'text' | 'audio' | 'video' | 'document' | 'rlhf'

export interface AssetTypeInfo {
  type: AssetType
  category: string
  needsThumbnail: boolean
  needsProcessing: boolean
}

/**
 * Detect asset type from filename and MIME type
 */
export function detectAssetType(filename: string, mimeType?: string): AssetTypeInfo {
  const ext = filename.toLowerCase().split('.').pop() || ''
  const mime = mimeType?.toLowerCase() || ''

  // Image types
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext)) {
    return {
      type: 'image',
      category: 'visual',
      needsThumbnail: true,
      needsProcessing: true
    }
  }

  // Text types
  if (['txt', 'csv', 'tsv', 'md'].includes(ext) || mime.startsWith('text/')) {
    return {
      type: 'text',
      category: 'text',
      needsThumbnail: false,
      needsProcessing: false
    }
  }

  // RLHF/JSON types
  if (['json', 'jsonl', 'ndjson'].includes(ext) || mime === 'application/json') {
    return {
      type: 'rlhf',
      category: 'text',
      needsThumbnail: false,
      needsProcessing: false
    }
  }

  // Audio types
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return {
      type: 'audio',
      category: 'media',
      needsThumbnail: false,
      needsProcessing: true
    }
  }

  // Video types
  if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv'].includes(ext)) {
    return {
      type: 'video',
      category: 'media',
      needsThumbnail: true,
      needsProcessing: true
    }
  }

  // Document types
  if (['pdf', 'doc', 'docx', 'odt'].includes(ext) || mime === 'application/pdf') {
    return {
      type: 'document',
      category: 'document',
      needsThumbnail: true,
      needsProcessing: true
    }
  }

  // Default to text for unknown types
  return {
    type: 'text',
    category: 'text',
    needsThumbnail: false,
    needsProcessing: false
  }
}

/**
 * Get accepted file extensions for a project tool type
 */
export function getAcceptedExtensions(toolType: string): string {
  const extensionMap: Record<string, string> = {
    image: '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff',
    text: '.txt,.csv,.tsv,.md',
    audio: '.mp3,.wav,.ogg,.m4a,.flac,.aac',
    video: '.mp4,.mov,.avi,.webm,.mkv',
    document: '.pdf,.doc,.docx,.odt',
    rlhf: '.json,.jsonl',
    classification: '.txt,.csv,.json',
    sentiment: '.txt,.csv,.json',
    ner: '.txt,.csv,.json'
  }

  return extensionMap[toolType] || '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff'
}

/**
 * Validate if file type matches project tool type
 */
export function validateFileType(assetType: AssetType, projectToolType: string): boolean {
  const validMappings: Record<string, AssetType[]> = {
    image: ['image'],
    text: ['text'],
    audio: ['audio'],
    video: ['video'],
    document: ['document'],
    rlhf: ['rlhf'],
    classification: ['text', 'rlhf'],
    sentiment: ['text', 'rlhf'],
    ner: ['text']
  }

  const allowedTypes = validMappings[projectToolType] || ['image']
  return allowedTypes.includes(assetType)
}
