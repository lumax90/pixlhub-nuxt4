import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      })
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        labels: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        assets: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            tasks: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1 // Get latest task for each asset
            }
          }
        },
        tasks: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            asset: true // Include asset info in tasks
          }
        },
        _count: {
          select: {
            assets: true,
            tasks: true,
            labels: true
          }
        }
      }
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      })
    }

    // Calculate actual stats from tasks (don't trust stored values)
    const actualTotalTasks = project.tasks.length
    const actualCompletedTasks = project.tasks.filter(t => t.status === 'completed').length

    // Override stored values with calculated ones
    const projectWithCorrectStats = {
      ...project,
      totalTasks: actualTotalTasks,
      completedTasks: actualCompletedTasks
    }

    return {
      success: true,
      data: projectWithCorrectStats
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch project'
    })
  }
})
