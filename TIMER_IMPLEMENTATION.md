# Task Timer Implementation Guide

## Overview
Track time spent on each task during labeling and review workflows.

## Database Changes Needed

### Update Task Model (Prisma Schema)
```prisma
model Task {
  // ... existing fields
  
  // Time tracking
  timeSpent       Int      @default(0)  // Total seconds spent on this task
  timerStartedAt  DateTime?             // When current session started
  
  // ... rest of fields
}
```

Run migration:
```bash
npx prisma migrate dev --name add_task_timer
```

## Implementation Approach

### 1. **Simple Approach (Recommended)**
No external library needed - use built-in JavaScript.

#### In Annotation Tool Component:
```typescript
// Timer state
const timerStartTime = ref<number | null>(null)
const elapsedTime = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

// Start timer when task loads
const startTimer = () => {
  timerStartTime.value = Date.now()
  
  timerInterval.value = setInterval(() => {
    if (timerStartTime.value) {
      elapsedTime.value = Math.floor((Date.now() - timerStartTime.value) / 1000)
    }
  }, 1000) // Update every second
}

// Stop timer and save
const stopTimer = async () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  // Save time to database
  await $fetch(`/api/tasks/${taskId}/time`, {
    method: 'POST',
    body: { timeSpent: elapsedTime.value }
  })
}

// Format display
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})
```

#### Display in UI:
```vue
<div class="timer-display">
  <Clock :size="16" />
  <span>{{ formatTime(elapsedTime) }}</span>
</div>
```

### 2. **With VueUse (Already in Project)**
VueUse has `useTimestamp` and `useIntervalFn`:

```typescript
import { useTimestamp, useIntervalFn } from '@vueuse/core'

const startTime = ref(Date.now())
const { timestamp } = useTimestamp({ interval: 1000 })

const elapsedSeconds = computed(() => 
  Math.floor((timestamp.value - startTime.value) / 1000)
)

// Auto-save every 30 seconds
useIntervalFn(() => {
  saveTimeToDatabase()
}, 30000)
```

### 3. **Backend API Endpoint**

Create `/server/api/tasks/[id]/time.post.ts`:
```typescript
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { timeSpent } = await readBody(event)
  
  // Update task time
  await prisma.task.update({
    where: { id },
    data: {
      timeSpent: {
        increment: timeSpent // Add to existing time
      },
      timerStartedAt: null // Reset timer
    }
  })
  
  return { success: true }
})
```

### 4. **Statistics Calculation**

Update `/server/api/projects/[id]/export-stats.get.ts`:
```typescript
// Calculate time statistics
const timings = tasks
  .filter(t => t.timeSpent > 0)
  .map(t => t.timeSpent)

const totalDuration = timings.reduce((sum, t) => sum + t, 0)
const avgTimePerTask = timings.length > 0 ? totalDuration / timings.length : 0
const fastestTask = timings.length > 0 ? Math.min(...timings) : 0
const slowestTask = timings.length > 0 ? Math.max(...timings) : 0

return {
  // ... existing stats
  totalDuration,
  avgTimePerTask,
  fastestTask,
  slowestTask
}
```

## Features to Add

### 1. **Auto-save Timer**
Save progress every 30 seconds to prevent data loss:
```typescript
useIntervalFn(() => {
  if (elapsedTime.value > 0) {
    saveTimeToDatabase()
  }
}, 30000)
```

### 2. **Pause/Resume**
```typescript
const isPaused = ref(false)

const pauseTimer = () => {
  isPaused.value = true
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
}

const resumeTimer = () => {
  isPaused.value = false
  startTimer()
}
```

### 3. **Idle Detection**
Pause timer when user is inactive:
```typescript
import { useIdle } from '@vueuse/core'

const { idle } = useIdle(5 * 60 * 1000) // 5 minutes

watch(idle, (isIdle) => {
  if (isIdle) pauseTimer()
  else resumeTimer()
})
```

## UI Components

### Timer Display
```vue
<div class="fixed top-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
  <div class="flex items-center gap-2">
    <Clock :size="16" class="text-blue-500" />
    <span class="font-mono text-lg">{{ formatTime(elapsedTime) }}</span>
    <NButton size="tiny" @click="isPaused ? resumeTimer() : pauseTimer()">
      {{ isPaused ? 'Resume' : 'Pause' }}
    </NButton>
  </div>
</div>
```

## Recommendation

**Use Simple Approach (#1)** because:
- ✅ No external dependencies
- ✅ Full control over behavior
- ✅ Easy to debug
- ✅ Lightweight
- ✅ VueUse is already available if needed

**Implementation Steps:**
1. Add database fields (5 min)
2. Add timer logic to annotation tool (15 min)
3. Create save API endpoint (10 min)
4. Update stats calculation (10 min)
5. Add UI display (5 min)

**Total: ~45 minutes of work**

## Testing
- Start task → timer should start
- Complete task → time should save
- Refresh page → accumulated time should persist
- Check stats → should show accurate averages
