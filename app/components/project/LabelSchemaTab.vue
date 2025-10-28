<script setup lang="ts">
import { Plus, Trash2, GripVertical, AlertTriangle, Save } from 'lucide-vue-next'
import type { LabelClass } from '~/types'

const props = defineProps<{
  projectId: string
}>()

const { isDark } = useTheme()

// State
const labelClasses = ref<LabelClass[]>([])
const showWarning = ref(false)
const hasChanges = ref(false)
const isSaving = ref(false)

// Generate random color
const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

// Initialize with mock data (will be replaced with API call)
onMounted(() => {
  loadLabelSchema()
})

const loadLabelSchema = () => {
  // TODO: Load from API
  // For now, use mock data
  labelClasses.value = [
    {
      id: 'label_1',
      labelSchemaId: 'schema_1',
      name: 'Person',
      color: '#FF6B6B',
      shortcut: '1',
      description: 'Human beings in the image',
      order: 0,
      attributes: [],
      annotationTypes: ['bounding-box', 'polygon'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'label_2',
      labelSchemaId: 'schema_1',
      name: 'Vehicle',
      color: '#4ECDC4',
      shortcut: '2',
      description: 'Cars, trucks, motorcycles',
      order: 1,
      attributes: [],
      annotationTypes: ['bounding-box', 'polygon'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'label_3',
      labelSchemaId: 'schema_1',
      name: 'Traffic Sign',
      color: '#FFE66D',
      shortcut: '3',
      description: 'Road signs and signals',
      order: 2,
      attributes: [],
      annotationTypes: ['bounding-box'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}

// Add new label
const addLabel = () => {
  const newOrder = labelClasses.value.length
  const newLabel: LabelClass = {
    id: `label_${Date.now()}`,
    labelSchemaId: 'schema_1',
    name: `Label ${newOrder + 1}`,
    color: generateRandomColor(),
    shortcut: newOrder < 9 ? String(newOrder + 1) : undefined,
    description: '',
    order: newOrder,
    attributes: [],
    annotationTypes: ['bounding-box', 'polygon'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  labelClasses.value.push(newLabel)
  hasChanges.value = true
}

// Remove label
const removeLabel = (id: string) => {
  labelClasses.value = labelClasses.value.filter(label => label.id !== id)
  // Reorder remaining labels
  labelClasses.value.forEach((label, index) => {
    label.order = index
  })
  hasChanges.value = true
}

// Update label field
const updateLabel = (id: string, field: keyof LabelClass, value: any) => {
  const label = labelClasses.value.find(l => l.id === id)
  if (label) {
    (label as any)[field] = value
    label.updatedAt = new Date()
    hasChanges.value = true
  }
}

// Validate labels
const validateLabels = () => {
  const errors: string[] = []
  
  // Check for duplicate names
  const names = labelClasses.value.map(l => l.name.toLowerCase())
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicateNames.length > 0) {
    errors.push('Duplicate label names found')
  }
  
  // Check for duplicate shortcuts
  const shortcuts = labelClasses.value.map(l => l.shortcut).filter(Boolean)
  const duplicateShortcuts = shortcuts.filter((shortcut, index) => shortcuts.indexOf(shortcut) !== index)
  if (duplicateShortcuts.length > 0) {
    errors.push('Duplicate keyboard shortcuts found')
  }
  
  // Check for empty names
  if (labelClasses.value.some(l => !l.name.trim())) {
    errors.push('All labels must have a name')
  }
  
  return errors
}

// Save labels
const handleSave = () => {
  const errors = validateLabels()
  if (errors.length > 0) {
    alert(errors.join('\n'))
    return
  }
  showWarning.value = true
}

const confirmSave = async () => {
  isSaving.value = true
  try {
    // TODO: Save to API
    // await $fetch(`/api/projects/${props.projectId}/labels`, {
    //   method: 'POST',
    //   body: { classes: labelClasses.value }
    // })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    hasChanges.value = false
    showWarning.value = false
    alert('Label schema saved successfully!')
  } catch (error) {
    alert('Failed to save label schema')
  } finally {
    isSaving.value = false
  }
}

const cancelSave = () => {
  showWarning.value = false
}

// Discard changes
const discardChanges = () => {
  if (confirm('Are you sure you want to discard all changes?')) {
    loadLabelSchema()
    hasChanges.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Label Classes</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Define the categories for annotation. Each label can have a keyboard shortcut (1-9).
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="hasChanges"
          @click="discardChanges"
          class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Discard
        </button>
        <button
          @click="handleSave"
          :disabled="!hasChanges || isSaving"
          :class="[
            'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            hasChanges && !isSaving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          ]"
        >
          <Save :size="16" />
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Label List -->
    <div class="space-y-3">
      <div
        v-for="(label, index) in labelClasses"
        :key="label.id"
        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <!-- Drag Handle -->
          <div class="pt-2 cursor-move text-gray-400 dark:text-gray-600">
            <GripVertical :size="18" />
          </div>

          <!-- Order Number -->
          <div class="pt-2 text-sm font-mono text-gray-500 dark:text-gray-400 w-6">
            {{ index + 1 }}
          </div>

          <!-- Form Fields -->
          <div class="flex-1 space-y-3">
            <!-- Name and Shortcut Row -->
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label Name *
                </label>
                <input
                  :value="label.name"
                  @input="updateLabel(label.id, 'name', ($event.target as HTMLInputElement).value)"
                  placeholder="e.g., Person, Vehicle, Building"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div class="w-24">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shortcut
                </label>
                <input
                  :value="label.shortcut"
                  @input="updateLabel(label.id, 'shortcut', ($event.target as HTMLInputElement).value)"
                  placeholder="1-9"
                  maxlength="1"
                  class="w-full px-3 py-2 text-sm text-center border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div class="w-32">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    :value="label.color"
                    @input="updateLabel(label.id, 'color', ($event.target as HTMLInputElement).value)"
                    class="w-12 h-9 rounded border-0 cursor-pointer"
                  />
                  <input
                    :value="label.color"
                    @input="updateLabel(label.id, 'color', ($event.target as HTMLInputElement).value)"
                    placeholder="#000000"
                    class="w-20 px-2 py-2 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <!-- Description Row -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <input
                :value="label.description"
                @input="updateLabel(label.id, 'description', ($event.target as HTMLInputElement).value)"
                placeholder="Brief description or guidelines for this label"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Delete Button -->
          <button
            @click="removeLabel(label.id)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete label"
          >
            <Trash2 :size="18" />
          </button>
        </div>
      </div>

      <!-- Add New Label Button -->
      <button
        @click="addLabel"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Plus :size="18" />
        Add New Label Class
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="labelClasses.length === 0"
      class="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"
    >
      <p class="text-gray-600 dark:text-gray-400 mb-4">No label classes defined yet</p>
      <button
        @click="addLabel"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        <Plus :size="18" />
        Create First Label
      </button>
    </div>

    <!-- Warning Modal -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showWarning"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="cancelSave"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 p-6">
          <div class="flex items-start gap-3 mb-4">
            <div class="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle :size="24" class="text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Warning: Schema Changes
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Changing the label schema may affect existing annotations. Annotations with deleted or modified labels may need to be re-labeled.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="cancelSave"
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmSave"
              :disabled="isSaving"
              class="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Continue & Save' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
