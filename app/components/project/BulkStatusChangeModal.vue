<script setup lang="ts">
import { NModal, NCard, NSelect, NCheckbox, NButton, NSpace, NText, useMessage } from 'naive-ui'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  selectedTaskIds: string[]
  projectId: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const message = useMessage()

// Form state
const selectedStatus = ref<string | null>(null)
const removeAnnotations = ref(false)
const removeAssignees = ref(false)
const removeStageHistory = ref(false)
const isSubmitting = ref(false)

// Status options
const statusOptions = [
  { label: 'Label Queue', value: 'label' },
  { label: 'Review Queue', value: 'review' },
  { label: 'Completed', value: 'completed' }
]

// Reset form when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    selectedStatus.value = null
    removeAnnotations.value = false
    removeAssignees.value = false
    removeStageHistory.value = false
  }
})

// Handle submit
const handleSubmit = async () => {
  if (!selectedStatus.value) {
    message.warning('Please select a destination stage')
    return
  }

  isSubmitting.value = true

  try {
    // Call bulk update API with options
    const response = await $fetch('/api/tasks/bulk-status-change', {
      method: 'POST',
      body: {
        taskIds: props.selectedTaskIds,
        newStatus: selectedStatus.value,
        removeAnnotations: removeAnnotations.value,
        removeAssignees: removeAssignees.value,
        removeStageHistory: removeStageHistory.value
      }
    })

    if (response.success) {
      message.success(`Updated ${props.selectedTaskIds.length} task(s) to ${selectedStatus.value}`)
      emit('success')
      emit('update:show', false)
    }
  } catch (error) {
    console.error('Error updating tasks:', error)
    message.error('Failed to update tasks')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    @update:show="(val: boolean) => emit('update:show', val)"
    preset="card"
    title="Re-queue Tasks"
    class="w-[600px]"
    :bordered="false"
    :segmented="{
      content: true,
      footer: 'soft'
    }"
  >
    <template #header-extra>
      <NButton text @click="handleCancel">
        <template #icon>
          <X :size="18" />
        </template>
      </NButton>
    </template>

    <div class="space-y-6">
      <!-- Task count -->
      <NText class="text-base">
        <span class="font-semibold">{{ selectedTaskIds.length }} task{{ selectedTaskIds.length > 1 ? 's' : '' }}</span>
        will be affected.
      </NText>

      <!-- Status selector -->
      <div>
        <NSelect
          v-model:value="selectedStatus"
          :options="statusOptions"
          placeholder="Select the Destination Stage"
          size="large"
        />
      </div>

      <!-- Options -->
      <div class="space-y-4">
        <!-- Remove Annotations -->
        <div class="flex items-start gap-3">
          <NCheckbox v-model:checked="removeAnnotations" size="large" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base font-semibold">Remove Annotations</span>
            </div>
            <NText depth="3" class="text-sm">
              Remove existing annotations on the tasks so that labelers will start with an empty task.
            </NText>
          </div>
        </div>

        <!-- Remove Assignees -->
        <div class="flex items-start gap-3">
          <NCheckbox v-model:checked="removeAssignees" size="large" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base font-semibold">Remove Assignees</span>
            </div>
            <NText depth="3" class="text-sm">
              Remove existing assignees on the tasks so that it will be available in the queue.
            </NText>
          </div>
        </div>

        <!-- Remove Stage History -->
        <div class="flex items-start gap-3">
          <NCheckbox v-model:checked="removeStageHistory" size="large" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base font-semibold">Remove Stage History</span>
            </div>
            <NText depth="3" class="text-sm">
              Remove all the stage history of the tasks.
            </NText>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton @click="handleCancel" size="large">
          Cancel
        </NButton>
        <NButton
          type="primary"
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="!selectedStatus"
          size="large"
        >
          OK
        </NButton>
      </div>
    </template>
  </NModal>
</template>
