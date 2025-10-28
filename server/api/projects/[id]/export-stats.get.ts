import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    // Get all tasks with annotations
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        annotations: {
          include: {
            label: true
          }
        }
      }
    })

    // Calculate stats
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const labeledTasks = tasks.filter(t => t.status === 'label' || t.status === 'review').length
    
    let totalAnnotations = 0
    let bboxCount = 0
    let polygonCount = 0
    let pointCount = 0
    const labelStats: Record<string, number> = {}

    tasks.forEach(task => {
      task.annotations.forEach(ann => {
        totalAnnotations++
        
        // Count by type (check for different possible values)
        const type = ann.type.toLowerCase()
        if (type === 'bbox' || type === 'bounding-box' || type === 'boundingbox') {
          bboxCount++
        } else if (type === 'polygon' || type === 'segmentation') {
          polygonCount++
        } else if (type === 'point' || type === 'keypoint') {
          pointCount++
        }
        
        // Count by label
        const labelName = ann.label.name
        labelStats[labelName] = (labelStats[labelName] || 0) + 1
      })
    })

    // Sort labels by count (descending)
    const sortedLabels = Object.entries(labelStats)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {} as Record<string, number>)

    // Calculate time statistics
    const timings = tasks
      .filter(t => t.timeSpent > 0)
      .map(t => t.timeSpent)

    const totalDuration = timings.reduce((sum, t) => sum + t, 0)
    const avgTimePerTask = timings.length > 0 ? Math.round(totalDuration / timings.length) : 0
    const fastestTask = timings.length > 0 ? Math.min(...timings) : 0
    const slowestTask = timings.length > 0 ? Math.max(...timings) : 0

    return {
      success: true,
      data: {
        completedTasks,
        labeledTasks,
        totalAnnotations,
        bboxCount,
        polygonCount,
        pointCount,
        labelStats: sortedLabels,
        totalDuration,
        avgTimePerTask,
        fastestTask,
        slowestTask
      }
    }
  } catch (error) {
    console.error('Error fetching export stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch export stats'
    })
  }
})
