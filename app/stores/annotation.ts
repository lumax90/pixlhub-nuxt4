import { defineStore } from 'pinia'
import type { Annotation, Label, CanvasImage, BoundingBox, Point, Polygon } from '~/types'

export const useAnnotationStore = defineStore('annotation', () => {
  // State
  const currentImage = ref<CanvasImage | null>(null)
  const annotations = ref<Annotation[]>([])
  const labels = ref<Label[]>([])
  const selectedLabelId = ref<string | null>(null)
  const selectedAnnotationId = ref<string | null>(null)
  const currentTool = ref<'select' | 'bbox' | 'polygon' | 'point'>('bbox')
  
  // Canvas transform state
  const canvasTransform = ref({
    scale: 1,
    x: 0,
    y: 0
  })
  
  // Canvas dimensions (the viewport size)
  const canvasSize = ref({
    width: 1200,
    height: 800
  })
  
  // Scaled image dimensions (how big the image appears on canvas)
  const scaledImageSize = ref({
    width: 0,
    height: 0
  })
  
  // History for undo/redo
  const history = ref<Annotation[][]>([])
  const historyIndex = ref(-1)
  
  // Getters
  const selectedAnnotation = computed(() =>
    annotations.value.find((a: Annotation) => a.id === selectedAnnotationId.value)
  )
  
  const currentLabel = computed(() =>
    labels.value.find((l: Label) => l.id === selectedLabelId.value)
  )
  
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  
  // Actions
  function setImage(image: CanvasImage) {
    currentImage.value = image
    annotations.value = image.annotations || []
    
    // Calculate scaled image size to fit canvas
    calculateScaledImageSize()
    
    // Reset history
    saveToHistory()
  }
  
  function calculateScaledImageSize() {
    if (!currentImage.value) return
    
    const img = currentImage.value
    const canvas = canvasSize.value
    
    // Calculate scale to fit image in canvas while maintaining aspect ratio
    const scaleX = canvas.width / img.width
    const scaleY = canvas.height / img.height
    const scale = Math.min(scaleX, scaleY) * 0.9 // 0.9 for padding
    
    scaledImageSize.value = {
      width: img.width * scale,
      height: img.height * scale
    }
  }
  
  function setCanvasSize(width: number, height: number) {
    canvasSize.value = { width, height }
    calculateScaledImageSize()
  }
  
  function setTool(tool: 'select' | 'bbox' | 'polygon' | 'point') {
    currentTool.value = tool
  }
  
  function setLabels(newLabels: Label[]) {
    labels.value = newLabels
    if (newLabels.length > 0 && !selectedLabelId.value && newLabels[0]) {
      selectedLabelId.value = newLabels[0].id
    }
  }
  
  function setSelectedLabel(labelId: string) {
    selectedLabelId.value = labelId
  }
  
  function addAnnotation(annotation: Annotation) {
    saveToHistory()
    annotations.value.push(annotation)
    
    // Auto-select the new annotation (industry standard behavior)
    selectedAnnotationId.value = annotation.id
    
    // Save to localStorage
    saveToLocalStorage()
  }
  
  function updateAnnotation(id: string, updates: Partial<Annotation>) {
    const index = annotations.value.findIndex((a: Annotation) => a.id === id)
    if (index !== -1) {
      annotations.value[index] = { ...annotations.value[index], ...updates } as Annotation
      saveToLocalStorage()
    }
  }
  
  function deleteAnnotation(id: string) {
    saveToHistory()
    annotations.value = annotations.value.filter((a: Annotation) => a.id !== id)
    if (selectedAnnotationId.value === id) {
      selectedAnnotationId.value = null
    }
    saveToLocalStorage()
  }
  
  function selectAnnotation(id: string | null) {
    selectedAnnotationId.value = id
  }
  
  function toggleAnnotationVisibility(id: string) {
    const annotation = annotations.value.find((a: Annotation) => a.id === id)
    if (annotation) {
      annotation.visible = !annotation.visible
      saveToLocalStorage()
    }
  }
  
  // History management
  function saveToHistory() {
    // Remove any future history if we're not at the end
    const newHistory = history.value.slice(0, historyIndex.value + 1)
    
    // Deep clone current annotations
    newHistory.push(JSON.parse(JSON.stringify(annotations.value)))
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      historyIndex.value++
    }
    
    history.value = newHistory
  }
  
  function undo() {
    if (canUndo.value) {
      historyIndex.value--
      annotations.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
      saveToLocalStorage()
    }
  }
  
  function redo() {
    if (canRedo.value) {
      historyIndex.value++
      annotations.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
      saveToLocalStorage()
    }
  }
  
  // Zoom & Pan
  function zoomIn() {
    canvasTransform.value.scale = Math.min(canvasTransform.value.scale * 1.2, 5)
  }
  
  function zoomOut() {
    canvasTransform.value.scale = Math.max(canvasTransform.value.scale / 1.2, 0.1)
  }
  
  function resetZoom() {
    canvasTransform.value = { scale: 1, x: 0, y: 0 }
  }
  
  function setCanvasTransform(transform: Partial<typeof canvasTransform.value>) {
    canvasTransform.value = { ...canvasTransform.value, ...transform }
  }
  
  // LocalStorage persistence
  function saveToLocalStorage() {
    if (!currentImage.value) return
    
    try {
      const data = {
        image: currentImage.value,
        annotations: annotations.value,
        labels: labels.value
      }
      localStorage.setItem('pixlhub-annotations', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
  
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('pixlhub-annotations')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.image) {
          setImage(data.image)
        }
        if (data.labels) {
          setLabels(data.labels)
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
  }
  
  function reset() {
    currentImage.value = null
    annotations.value = []
    selectedAnnotationId.value = null
    selectedLabelId.value = null
    currentTool.value = 'bbox'
    canvasTransform.value = { scale: 1, x: 0, y: 0 }
    history.value = []
    historyIndex.value = -1
  }
  
  return {
    // State
    currentImage,
    annotations,
    labels,
    selectedLabelId,
    selectedAnnotationId,
    currentTool,
    canvasTransform,
    canvasSize,
    scaledImageSize,
    
    // Getters
    selectedAnnotation,
    currentLabel,
    canUndo,
    canRedo,
    
    // Actions
    setImage,
    setCanvasSize,
    setTool,
    setLabels,
    setSelectedLabel,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    toggleAnnotationVisibility,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    setCanvasTransform,
    saveToLocalStorage,
    loadFromLocalStorage,
    reset
  }
})
