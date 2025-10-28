import prisma from '../utils/prisma'
import { labelQueue, reviewQueue, completedQueue } from '../queues/config'

export type TaskStatus = 'prelabel' | 'label' | 'review' | 'completed'

/**
 * Create a task from an asset and add to appropriate queue
 */
export async function createTaskFromAsset(assetId: string, projectId: string, status: TaskStatus = 'label') {
  const task = await prisma.task.create({
    data: {
      assetId,
      projectId,
      status,
      priority: 0
    },
    include: {
      asset: true
    }
  })

  // Add to appropriate queue
  await addTaskToQueue(task.id, status)

  return task
}

/**
 * Add task to appropriate queue based on status
 */
export async function addTaskToQueue(taskId: string, status: TaskStatus) {
  const jobData = { taskId, timestamp: Date.now() }

  switch (status) {
    case 'label':
      await labelQueue.add('label-task', jobData, {
        priority: 1,
        removeOnComplete: 100,
        removeOnFail: 50
      })
      break
    case 'review':
      await reviewQueue.add('review-task', jobData, {
        priority: 1,
        removeOnComplete: 100,
        removeOnFail: 50
      })
      break
    case 'completed':
      await completedQueue.add('completed-task', jobData, {
        removeOnComplete: 1000
      })
      break
  }
}

/**
 * Transition task to next status and move to appropriate queue
 */
export async function transitionTaskStatus(taskId: string, newStatus: TaskStatus) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      ...(newStatus === 'label' && { startedAt: new Date() }),
      ...(newStatus === 'completed' && { completedAt: new Date() })
    }
  })

  // Add to new queue
  await addTaskToQueue(taskId, newStatus)

  // Note: Project stats (totalTasks, completedTasks) are now calculated dynamically
  // from actual task data in the API endpoints, not stored/incremented

  return task
}

/**
 * Assign task to a user
 */
export async function assignTask(taskId: string, userId: string) {
  return await prisma.task.update({
    where: { id: taskId },
    data: {
      assignedTo: userId,
      assignedAt: new Date()
    }
  })
}

/**
 * Get next available task from queue for a user
 */
export async function getNextTask(projectId: string, status: TaskStatus = 'label') {
  const task = await prisma.task.findFirst({
    where: {
      projectId,
      status,
      assignedTo: null
    },
    orderBy: [
      { priority: 'desc' },
      { queuedAt: 'asc' }
    ],
    include: {
      asset: true
    }
  })

  return task
}

/**
 * Get task queue stats
 */
export async function getQueueStats(projectId: string) {
  const [labelCount, reviewCount, completedCount, totalTasks] = await Promise.all([
    prisma.task.count({ where: { projectId, status: 'label' } }),
    prisma.task.count({ where: { projectId, status: 'review' } }),
    prisma.task.count({ where: { projectId, status: 'completed' } }),
    prisma.task.count({ where: { projectId } })
  ])

  return {
    label: labelCount,
    review: reviewCount,
    completed: completedCount,
    total: totalTasks
  }
}
