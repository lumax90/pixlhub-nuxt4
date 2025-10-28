import { ref } from 'vue'
import { getPendingItems, updateQueueItem, removeFromQueue, clearSyncedItems } from '~/utils/syncQueue'

const isSyncing = ref(false)
const pendingCount = ref(0)
const lastSyncTime = ref<number | null>(null)
let syncInterval: NodeJS.Timeout | null = null

export function useSyncService() {
  // Sync a single item
  async function syncItem(item: any) {
    try {
      // Update status to syncing
      await updateQueueItem(item.taskId, {
        status: 'syncing',
        lastAttempt: Date.now()
      })

      // Save annotations to database
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: item.taskId,
          annotations: item.annotations
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Verify response
      const result = await response.json()
      if (!result.success) {
        throw new Error('API returned success: false')
      }

      const count = result.data?.count ?? item.annotations.length
      console.log('✅ Background sync: Saved', count, 'annotations for task', item.taskId)

      // Update task status to review
      const statusResponse = await fetch(`/api/tasks/${item.taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'review' })
      })

      if (!statusResponse.ok) {
        throw new Error('Failed to update task status')
      }

      // Success - remove from queue
      await removeFromQueue(item.taskId)
      console.log('✅ Background sync: Task', item.taskId, 'completed')
      return true
    } catch (error: any) {
      // Failed - update with error
      await updateQueueItem(item.taskId, {
        status: 'failed',
        attempts: item.attempts + 1,
        error: error.message,
        lastAttempt: Date.now()
      })
      return false
    }
  }

  // Process all pending items
  async function processSyncQueue() {
    if (isSyncing.value) return // Already syncing

    isSyncing.value = true
    try {
      const items = await getPendingItems()
      pendingCount.value = items.length

      if (items.length === 0) {
        lastSyncTime.value = Date.now()
        return
      }

      // Process items one by one
      for (const item of items) {
        // Skip if too many attempts (max 5)
        if (item.attempts >= 5) continue

        // Exponential backoff: wait longer between retries
        if (item.lastAttempt) {
          const backoffTime = Math.min(1000 * Math.pow(2, item.attempts), 60000) // Max 1 min
          const timeSinceLastAttempt = Date.now() - item.lastAttempt
          if (timeSinceLastAttempt < backoffTime) {
            continue // Too soon to retry
          }
        }

        await syncItem(item)
      }

      // Update count after processing
      const remainingItems = await getPendingItems()
      pendingCount.value = remainingItems.length
      lastSyncTime.value = Date.now()
    } finally {
      isSyncing.value = false
    }
  }

  // Start background sync loop
  function startSyncLoop() {
    if (syncInterval) return // Already running

    // Initial sync
    processSyncQueue()

    // Sync every 15 seconds
    syncInterval = setInterval(() => {
      processSyncQueue()
    }, 15000)

    // Cleanup old items daily
    setInterval(() => {
      clearSyncedItems()
    }, 24 * 60 * 60 * 1000)
  }

  // Stop sync loop
  function stopSyncLoop() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  // Manual sync trigger
  async function syncNow() {
    await processSyncQueue()
  }

  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    startSyncLoop,
    stopSyncLoop,
    syncNow
  }
}
