import localforage from 'localforage'

// Initialize IndexedDB store for sync queue
const syncQueue = localforage.createInstance({
  name: 'pixlhub',
  storeName: 'sync-queue',
  description: 'Queue for pending annotation syncs'
})

export interface QueueItem {
  taskId: string
  projectId: string
  annotations: any[]
  status: 'pending' | 'syncing' | 'failed'
  attempts: number
  lastAttempt?: number
  error?: string
  createdAt: number
}

// Add task to sync queue
export async function addToSyncQueue(taskId: string, projectId: string, annotations: any[]): Promise<void> {
  // Deep clone to remove Vue reactivity and make it serializable
  const serializedAnnotations = JSON.parse(JSON.stringify(annotations))
  
  const item: QueueItem = {
    taskId,
    projectId,
    annotations: serializedAnnotations,
    status: 'pending',
    attempts: 0,
    createdAt: Date.now()
  }
  await syncQueue.setItem(taskId, item)
}

// Get all pending items
export async function getPendingItems(): Promise<QueueItem[]> {
  const items: QueueItem[] = []
  await syncQueue.iterate((value: QueueItem) => {
    if (value.status === 'pending' || value.status === 'failed') {
      items.push(value)
    }
  })
  return items.sort((a, b) => a.createdAt - b.createdAt)
}

// Update item status
export async function updateQueueItem(taskId: string, updates: Partial<QueueItem>): Promise<void> {
  const item = await syncQueue.getItem<QueueItem>(taskId)
  if (item) {
    await syncQueue.setItem(taskId, { ...item, ...updates })
  }
}

// Remove item from queue
export async function removeFromQueue(taskId: string): Promise<void> {
  await syncQueue.removeItem(taskId)
}

// Get queue count
export async function getQueueCount(): Promise<number> {
  return await syncQueue.length()
}

// Clear all synced items (cleanup)
export async function clearSyncedItems(): Promise<void> {
  const toRemove: string[] = []
  await syncQueue.iterate((value: QueueItem, key: string) => {
    // Remove items older than 7 days that are still pending (likely orphaned)
    const age = Date.now() - value.createdAt
    if (age > 7 * 24 * 60 * 60 * 1000) {
      toRemove.push(key)
    }
  })
  
  for (const key of toRemove) {
    await syncQueue.removeItem(key)
  }
}
