import { defineStore } from 'pinia'

export interface Comment {
  id: string
  taskId: string
  x: number // Position on image (percentage)
  y: number // Position on image (percentage)
  message: string
  author: string
  createdAt: Date
  resolved: boolean
}

export const useCommentStore = defineStore('comment', () => {
  // State
  const comments = ref<Comment[]>([])
  const activeCommentId = ref<string | null>(null)
  const isAddingComment = ref(false)
  const pendingCommentPosition = ref<{ x: number; y: number } | null>(null)
  const currentTaskId = ref<string | null>(null)

  // Getters
  const activeComment = computed(() =>
    comments.value.find(c => c.id === activeCommentId.value)
  )

  // Filter comments by current task
  const taskComments = computed(() =>
    currentTaskId.value 
      ? comments.value.filter(c => c.taskId === currentTaskId.value)
      : []
  )

  const unresolvedComments = computed(() =>
    taskComments.value.filter(c => !c.resolved)
  )

  // Actions
  function setComments(newComments: Comment[]) {
    comments.value = newComments
  }

  function addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }
    comments.value.push(newComment)
    return newComment
  }

  function updateComment(id: string, updates: Partial<Comment>) {
    const index = comments.value.findIndex(c => c.id === id)
    if (index !== -1) {
      const existing = comments.value[index]
      if (existing) {
        comments.value[index] = { ...existing, ...updates }
      }
    }
  }

  function deleteComment(id: string) {
    comments.value = comments.value.filter(c => c.id !== id)
    if (activeCommentId.value === id) {
      activeCommentId.value = null
    }
  }

  function setActiveComment(id: string | null) {
    activeCommentId.value = id
  }

  function toggleResolved(id: string) {
    const comment = comments.value.find(c => c.id === id)
    if (comment) {
      comment.resolved = !comment.resolved
    }
  }

  function startAddingComment(position: { x: number; y: number }) {
    isAddingComment.value = true
    pendingCommentPosition.value = position
  }

  function cancelAddingComment() {
    isAddingComment.value = false
    pendingCommentPosition.value = null
  }

  function setCurrentTask(taskId: string | null) {
    currentTaskId.value = taskId
  }

  function reset() {
    comments.value = []
    activeCommentId.value = null
    isAddingComment.value = false
    pendingCommentPosition.value = null
    currentTaskId.value = null
  }

  return {
    // State
    comments,
    activeCommentId,
    isAddingComment,
    pendingCommentPosition,
    currentTaskId,

    // Getters
    activeComment,
    taskComments,
    unresolvedComments,

    // Actions
    setComments,
    addComment,
    updateComment,
    deleteComment,
    setActiveComment,
    toggleResolved,
    startAddingComment,
    cancelAddingComment,
    setCurrentTask,
    reset
  }
})
