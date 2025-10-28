import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        labels: true,
        tasks: {
          select: {
            status: true
          }
        },
        _count: {
          select: {
            tasks: true,
            labels: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate correct stats for each project
    const projectsWithCorrectStats = projects.map(project => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(t => t.status === 'completed').length
      
      return {
        ...project,
        totalTasks,
        completedTasks
      }
    })

    return {
      success: true,
      data: projectsWithCorrectStats
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch projects'
    })
  }
})
