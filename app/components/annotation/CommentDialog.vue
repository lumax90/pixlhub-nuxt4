<script setup lang="ts">
import { NModal, NCard, NInput, NButton, NSpace, useMessage } from 'naive-ui'

const commentStore = useCommentStore()
const message = useMessage()
const route = useRoute()

const commentText = ref('')

const handleSubmit = () => {
  if (!commentText.value.trim()) {
    message.warning('Please enter a comment')
    return
  }

  if (!commentStore.pendingCommentPosition) {
    message.error('No comment position set')
    return
  }

  const taskId = route.query.task as string
  
  if (!taskId) {
    message.error('No task ID found')
    return
  }

  const newComment = commentStore.addComment({
    taskId,
    x: commentStore.pendingCommentPosition.x,
    y: commentStore.pendingCommentPosition.y,
    message: commentText.value.trim(),
    author: 'Current User', // TODO: Get from auth
    resolved: false
  })

  console.log('✅ Comment added:', newComment)
  console.log('📊 Total comments:', commentStore.comments.length)
  console.log('📊 Task comments:', commentStore.taskComments.length)
  
  message.success('Comment added')
  commentText.value = ''
  commentStore.cancelAddingComment()
}

const handleCancel = () => {
  commentText.value = ''
  commentStore.cancelAddingComment()
}
</script>

<template>
  <NModal
    :show="commentStore.isAddingComment"
    @update:show="(val: boolean) => !val && handleCancel()"
    preset="card"
    title="Add Comment"
    style="width: 400px"
    :bordered="false"
    :segmented="{
      content: true,
      footer: 'soft'
    }"
  >
    <NInput
      v-model:value="commentText"
      type="textarea"
      placeholder="Enter your comment or question..."
      :rows="4"
      :autofocus="true"
      @keydown.enter.ctrl="handleSubmit"
    />
    
    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleCancel">Cancel</NButton>
        <NButton type="primary" @click="handleSubmit">
          Add Comment
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
