<script setup lang="ts">
import { NModal, NCard, NText, NButton, NSpace, NIcon } from 'naive-ui'
import { Check, X } from 'lucide-vue-next'

const commentStore = useCommentStore()

const handleClose = () => {
  commentStore.setActiveComment(null)
}

const handleToggleResolved = () => {
  if (commentStore.activeComment) {
    commentStore.toggleResolved(commentStore.activeComment.id)
  }
}

const handleDelete = () => {
  if (commentStore.activeComment) {
    commentStore.deleteComment(commentStore.activeComment.id)
    handleClose()
  }
}
</script>

<template>
  <NModal
    :show="!!commentStore.activeComment"
    @update:show="(val: boolean) => !val && handleClose()"
    preset="card"
    title="Comment"
    style="width: 400px"
    :bordered="false"
    :segmented="{
      content: true,
      footer: 'soft'
    }"
  >
    <div v-if="commentStore.activeComment" class="space-y-3">
      <!-- Author and Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="commentStore.activeComment.resolved ? 'bg-green-500' : 'bg-amber-500'"
          />
          <NText class="text-sm font-medium">{{ commentStore.activeComment.author }}</NText>
        </div>
        <NText depth="3" class="text-xs">
          {{ new Date(commentStore.activeComment.createdAt).toLocaleString() }}
        </NText>
      </div>
      
      <!-- Message -->
      <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <NText class="text-sm">{{ commentStore.activeComment.message }}</NText>
      </div>
      
      <!-- Status Badge -->
      <div>
        <NText depth="3" class="text-xs">
          Status: 
          <span :class="commentStore.activeComment.resolved ? 'text-green-600' : 'text-amber-600'">
            {{ commentStore.activeComment.resolved ? 'Resolved' : 'Unresolved' }}
          </span>
        </NText>
      </div>
    </div>
    
    <template #footer>
      <NSpace justify="space-between">
        <NButton size="small" type="error" @click="handleDelete">
          <template #icon>
            <NIcon><X /></NIcon>
          </template>
          Delete
        </NButton>
        <NSpace>
          <NButton size="small" @click="handleToggleResolved">
            <template #icon>
              <NIcon><Check /></NIcon>
            </template>
            {{ commentStore.activeComment?.resolved ? 'Mark Unresolved' : 'Mark Resolved' }}
          </NButton>
          <NButton size="small" type="primary" @click="handleClose">
            Close
          </NButton>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>
