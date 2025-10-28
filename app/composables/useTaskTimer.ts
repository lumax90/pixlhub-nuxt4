import { ref, onMounted, onBeforeUnmount } from 'vue'

export const useTaskTimer = (taskId: string) => {
  const activeTime = ref(0)
  const displayTime = ref(0)
  const isActive = ref(false)
  
  let lastActivityTime = Date.now()
  let lastThrottleTime = 0
  let timerInterval: NodeJS.Timeout | null = null
  let saveInterval: NodeJS.Timeout | null = null
  let unsavedTime = 0
  
  const IDLE_THRESHOLD = 60000 // 60 seconds
  const THROTTLE_DELAY = 1000 // 1 second
  const SAVE_INTERVAL = 30000 // 30 seconds

  // Throttled activity handler (max once per second)
  const handleActivity = () => {
    const now = Date.now()
    
    // Only update if enough time has passed (throttling)
    if (now - lastThrottleTime >= THROTTLE_DELAY) {
      lastActivityTime = now
      lastThrottleTime = now
      isActive.value = true
    }
  }

  // Check if page is visible
  const isPageVisible = () => !document.hidden

  // Start tracking
  const startTimer = () => {
    // Timer tick (every second)
    timerInterval = setInterval(() => {
      const now = Date.now()
      const idleTime = now - lastActivityTime
      
      // Count time only if page is visible AND not idle
      if (isPageVisible() && idleTime < IDLE_THRESHOLD) {
        activeTime.value += 1
        unsavedTime += 1
        isActive.value = true
      } else {
        isActive.value = false
      }
      
      // Update display time
      displayTime.value = activeTime.value
    }, 1000)

    // Auto-save interval (every 30 seconds)
    saveInterval = setInterval(async () => {
      if (unsavedTime > 0) {
        await saveTime(unsavedTime)
        unsavedTime = 0
      }
    }, SAVE_INTERVAL)

    // Activity listeners (throttled)
    document.addEventListener('mousemove', handleActivity, { passive: true })
    document.addEventListener('keydown', handleActivity, { passive: true })
    document.addEventListener('click', handleActivity, { passive: true })
    
    // Visibility change listener
    document.addEventListener('visibilitychange', () => {
      if (isPageVisible()) {
        lastActivityTime = Date.now()
      }
    })
  }

  // Stop tracking
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    
    if (saveInterval) {
      clearInterval(saveInterval)
      saveInterval = null
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleActivity)
    document.removeEventListener('keydown', handleActivity)
    document.removeEventListener('click', handleActivity)
  }

  // Save time to database
  const saveTime = async (seconds: number) => {
    if (seconds === 0) return
    
    try {
      await $fetch(`/api/tasks/${taskId}/time`, {
        method: 'POST',
        body: { timeSpent: seconds }
      })
    } catch (error) {
      console.error('Failed to save time:', error)
      // Keep unsaved time to retry later
      unsavedTime += seconds
    }
  }

  // Final save (when task is submitted or component unmounts)
  const finalSave = async () => {
    stopTimer()
    if (unsavedTime > 0) {
      await saveTime(unsavedTime)
      unsavedTime = 0
    }
  }

  // Format time for display (MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Lifecycle
  onMounted(() => {
    startTimer()
  })

  onBeforeUnmount(() => {
    finalSave()
  })

  return {
    activeTime,
    displayTime,
    isActive,
    formatTime,
    finalSave
  }
}
