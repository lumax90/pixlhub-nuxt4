import prisma from '../utils/prisma'
import type { Prisma } from '@prisma/client'

export type ExportFormat = 'json' | 'coco' | 'yolo' | 'yolov8-seg' | 'pascal-voc' | 'csv' | 'custom'

export interface ExportOptions {
  includeMetadata: boolean
  includeNonReviewed: boolean
  includeReviewMetadata: boolean
  splitDataset: boolean
  trainSplit: number
  valSplit: number
  testSplit: number
  limit?: number // Optional limit for preview
}

/**
 * Convert polygon to bounding box
 */
function polygonToBbox(polygon: number[][]): { x: number; y: number; width: number; height: number } {
  const xs: number[] = []
  const ys: number[] = []
  
  polygon.forEach(p => {
    if (p[0] !== undefined) xs.push(p[0])
    if (p[1] !== undefined) ys.push(p[1])
  })
  
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Normalize coordinates (0-1)
 */
function normalizeCoords(value: number, max: number): number {
  return value / max
}

/**
 * Export to JSON (native format)
 */
export async function exportToJSON(projectId: string, options: ExportOptions) {
  const statusFilter = options.includeNonReviewed 
    ? ['label', 'review', 'completed']
    : ['completed']

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: statusFilter }
    },
    ...(options.limit && { take: options.limit }),
    include: {
      asset: true,
      annotations: {
        include: {
          label: true
        }
      }
    }
  })

  // Warn if no tasks found
  if (tasks.length === 0) {
    console.warn(`⚠️ No tasks found for export. Status filter: ${statusFilter.join(', ')}`)
  }

  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    projectId,
    totalTasks: tasks.length,
    totalAnnotations: tasks.reduce((sum, t) => sum + t.annotations.length, 0),
    tasks: tasks.map(task => ({
      id: task.id,
      status: task.status,
      asset: {
        id: task.asset.id,
        name: task.asset.name,
        url: task.asset.url,
        type: task.asset.type,
        ...(options.includeMetadata && { metadata: task.asset.metadata })
      },
      annotations: task.annotations.map(ann => {
        const data = ann.data as any
        return {
          id: ann.id,
          type: ann.type,
          labelId: ann.labelId,
          labelName: ann.label.name,
          ...data, // Spread all data (bbox, polygon, point, line, etc.)
          attributes: data.attributes || {}, // Explicitly include attributes
          ...(options.includeReviewMetadata && {
            createdAt: ann.createdAt,
            updatedAt: ann.updatedAt
          })
        }
      }),
      ...(options.includeReviewMetadata && {
        assignedTo: task.assignedTo,
        completedAt: task.completedAt
      })
    }))
  }

  return exportData
}

/**
 * Export to COCO format
 */
export async function exportToCOCO(projectId: string, options: ExportOptions) {
  const statusFilter = options.includeNonReviewed 
    ? ['label', 'review', 'completed']
    : ['completed']

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: statusFilter }
    },
    include: {
      asset: true,
      annotations: {
        include: {
          label: true
        }
      }
    }
  })

  // Get unique labels
  const labelMap = new Map()
  let labelId = 1
  
  tasks.forEach(task => {
    task.annotations.forEach(ann => {
      if (!labelMap.has(ann.label.name)) {
        labelMap.set(ann.label.name, labelId++)
      }
    })
  })

  const categories = Array.from(labelMap.entries()).map(([name, id]) => ({
    id,
    name,
    supercategory: 'object'
  }))

  const images: any[] = []
  const annotations: any[] = []
  let annId = 1

  tasks.forEach((task, imageId) => {
    const asset = task.asset
    const metadata = asset.metadata as any || {}
    
    images.push({
      id: imageId + 1,
      file_name: asset.name,
      width: metadata.width || 1920,
      height: metadata.height || 1080
    })

    task.annotations.forEach(ann => {
      const annData = ann.data as any
      const categoryId = labelMap.get(ann.label.name)
      
      let bbox: number[] = []
      let segmentation: number[][] = []
      let area = 0

      if (ann.type === 'bbox' && annData.bbox) {
        const b = annData.bbox
        bbox = [b.x, b.y, b.width, b.height]
        area = b.width * b.height
      } else if (ann.type === 'polygon' && annData.polygon) {
        // Convert polygon to COCO format
        const flatPoly = annData.polygon.flat()
        segmentation = [flatPoly]
        
        // Calculate bbox from polygon
        const bboxFromPoly = polygonToBbox(annData.polygon)
        bbox = [bboxFromPoly.x, bboxFromPoly.y, bboxFromPoly.width, bboxFromPoly.height]
        area = bboxFromPoly.width * bboxFromPoly.height
      }

      if (bbox.length > 0) {
        annotations.push({
          id: annId++,
          image_id: imageId + 1,
          category_id: categoryId,
          bbox,
          area,
          segmentation: segmentation.length > 0 ? segmentation : [],
          iscrowd: 0
        })
      }
    })
  })

  return {
    info: {
      description: 'PixlHub Export',
      version: '1.0',
      year: new Date().getFullYear(),
      date_created: new Date().toISOString()
    },
    licenses: [],
    images,
    annotations,
    categories
  }
}

/**
 * Export to YOLO format
 */
export async function exportToYOLO(projectId: string, options: ExportOptions) {
  const statusFilter = options.includeNonReviewed 
    ? ['label', 'review', 'completed']
    : ['completed']

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: statusFilter }
    },
    include: {
      asset: true,
      annotations: {
        include: {
          label: true
        }
      }
    }
  })

  // Get unique labels for classes.txt
  const labelSet = new Set<string>()
  tasks.forEach(task => {
    task.annotations.forEach(ann => {
      labelSet.add(ann.label.name)
    })
  })
  
  const classes = Array.from(labelSet)
  const classMap = new Map(classes.map((name, idx) => [name, idx]))

  // Generate YOLO format files
  const files: Record<string, string> = {}
  
  // classes.txt
  files['classes.txt'] = classes.join('\n')

  // Generate .txt file for each image
  tasks.forEach(task => {
    const asset = task.asset
    const metadata = asset.metadata as any || {}
    const imgWidth = metadata.width || 1920
    const imgHeight = metadata.height || 1080
    
    const lines: string[] = []
    
    task.annotations.forEach(ann => {
      const annData = ann.data as any
      const classId = classMap.get(ann.label.name) || 0
      
      let bbox = annData.bbox
      
      // Convert polygon to bbox if needed
      if (ann.type === 'polygon' && annData.polygon) {
        bbox = polygonToBbox(annData.polygon)
      }
      
      if (bbox) {
        // YOLO format: class_id x_center y_center width height (normalized)
        const xCenter = normalizeCoords(bbox.x + bbox.width / 2, imgWidth)
        const yCenter = normalizeCoords(bbox.y + bbox.height / 2, imgHeight)
        const width = normalizeCoords(bbox.width, imgWidth)
        const height = normalizeCoords(bbox.height, imgHeight)
        
        lines.push(`${classId} ${xCenter} ${yCenter} ${width} ${height}`)
      }
    })
    
    const filename = asset.name.replace(/\.[^/.]+$/, '.txt')
    files[filename] = lines.join('\n')
  })

  return { files, classes }
}

/**
 * Export to YOLOv8 Segmentation format
 */
export async function exportToYOLOv8Seg(projectId: string, options: ExportOptions) {
  const statusFilter = options.includeNonReviewed 
    ? ['label', 'review', 'completed']
    : ['completed']

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: statusFilter }
    },
    include: {
      asset: true,
      annotations: {
        include: {
          label: true
        }
      }
    }
  })

  const labelSet = new Set<string>()
  tasks.forEach(task => {
    task.annotations.forEach(ann => {
      labelSet.add(ann.label.name)
    })
  })
  
  const classes = Array.from(labelSet)
  const classMap = new Map(classes.map((name, idx) => [name, idx]))

  const files: Record<string, string> = {}
  files['classes.txt'] = classes.join('\n')

  tasks.forEach(task => {
    const asset = task.asset
    const metadata = asset.metadata as any || {}
    const imgWidth = metadata.width || 1920
    const imgHeight = metadata.height || 1080
    
    const lines: string[] = []
    
    task.annotations.forEach(ann => {
      const annData = ann.data as any
      const classId = classMap.get(ann.label.name) || 0
      
      if (ann.type === 'polygon' && annData.polygon) {
        // YOLOv8 seg format: class_id x1 y1 x2 y2 x3 y3... (normalized)
        const normalizedPoints = annData.polygon
          .map((point: number[]) => {
            const x = point[0] !== undefined ? point[0] : 0
            const y = point[1] !== undefined ? point[1] : 0
            return [
              normalizeCoords(x, imgWidth),
              normalizeCoords(y, imgHeight)
            ]
          })
          .flat()
          .join(' ')
        
        lines.push(`${classId} ${normalizedPoints}`)
      } else if (ann.type === 'bbox' && annData.bbox) {
        // Convert bbox to 4-point polygon
        const bbox = annData.bbox
        const points = [
          [bbox.x, bbox.y],
          [bbox.x + bbox.width, bbox.y],
          [bbox.x + bbox.width, bbox.y + bbox.height],
          [bbox.x, bbox.y + bbox.height]
        ]
        
        const normalizedPoints = points
          .map(point => [
            normalizeCoords(point[0], imgWidth),
            normalizeCoords(point[1], imgHeight)
          ])
          .flat()
          .join(' ')
        
        lines.push(`${classId} ${normalizedPoints}`)
      }
    })
    
    const filename = asset.name.replace(/\.[^/.]+$/, '.txt')
    files[filename] = lines.join('\n')
  })

  return { files, classes }
}

/**
 * Export to Pascal VOC format
 */
export async function exportToPascalVOC(projectId: string, options: ExportOptions) {
  const statusFilter = options.includeNonReviewed 
    ? ['label', 'review', 'completed']
    : ['completed']

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: statusFilter }
    },
    include: {
      asset: true,
      annotations: {
        include: {
          label: true
        }
      }
    }
  })

  const files: Record<string, string> = {}

  tasks.forEach(task => {
    const asset = task.asset
    const metadata = asset.metadata as any || {}
    const imgWidth = metadata.width || 1920
    const imgHeight = metadata.height || 1080
    
    let xml = `<annotation>
  <folder>images</folder>
  <filename>${asset.name}</filename>
  <size>
    <width>${imgWidth}</width>
    <height>${imgHeight}</height>
    <depth>3</depth>
  </size>
  <segmented>0</segmented>\n`

    task.annotations.forEach(ann => {
      const annData = ann.data as any
      let bbox = annData.bbox
      
      // Convert polygon to bbox if needed
      if (ann.type === 'polygon' && annData.polygon) {
        bbox = polygonToBbox(annData.polygon)
      }
      
      if (bbox) {
        xml += `  <object>
    <name>${ann.label.name}</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
      <xmin>${Math.round(bbox.x)}</xmin>
      <ymin>${Math.round(bbox.y)}</ymin>
      <xmax>${Math.round(bbox.x + bbox.width)}</xmax>
      <ymax>${Math.round(bbox.y + bbox.height)}</ymax>
    </bndbox>
  </object>\n`
      }
    })

    xml += `</annotation>`
    
    const filename = asset.name.replace(/\.[^/.]+$/, '.xml')
    files[filename] = xml
  })

  return { files }
}

/**
 * Export to CSV format
 */
export async function exportToCSV(projectId: string, options: ExportOptions) {
  const statusFilter = options.includeNonReviewed 
    ? ['label', 'review', 'completed']
    : ['completed']

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: statusFilter }
    },
    include: {
      asset: true,
      annotations: {
        include: {
          label: true
        }
      }
    }
  })

  const rows: string[] = []
  rows.push('filename,label,type,x,y,width,height,polygon_points')

  tasks.forEach(task => {
    const asset = task.asset
    
    task.annotations.forEach(ann => {
      const annData = ann.data as any
      
      if (ann.type === 'bbox' && annData.bbox) {
        const bbox = annData.bbox
        rows.push(`${asset.name},${ann.label.name},bbox,${bbox.x},${bbox.y},${bbox.width},${bbox.height},`)
      } else if (ann.type === 'polygon' && annData.polygon) {
        const bbox = polygonToBbox(annData.polygon)
        const polyStr = JSON.stringify(annData.polygon)
        rows.push(`${asset.name},${ann.label.name},polygon,${bbox.x},${bbox.y},${bbox.width},${bbox.height},"${polyStr}"`)
      }
    })
  })

  return rows.join('\n')
}
