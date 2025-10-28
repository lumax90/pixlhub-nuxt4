import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

// Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
})

// Queue names
export const QUEUE_NAMES = {
  LABEL: 'label-queue',
  REVIEW: 'review-queue',
  COMPLETED: 'completed-queue'
} as const

// Create queues
export const labelQueue = new Queue(QUEUE_NAMES.LABEL, { connection })
export const reviewQueue = new Queue(QUEUE_NAMES.REVIEW, { connection })
export const completedQueue = new Queue(QUEUE_NAMES.COMPLETED, { connection })

// Queue events for monitoring
export const labelQueueEvents = new QueueEvents(QUEUE_NAMES.LABEL, { connection })
export const reviewQueueEvents = new QueueEvents(QUEUE_NAMES.REVIEW, { connection })
export const completedQueueEvents = new QueueEvents(QUEUE_NAMES.COMPLETED, { connection })

console.log('✅ BullMQ Queues initialized')
