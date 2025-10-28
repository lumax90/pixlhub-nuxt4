<script setup lang="ts">
import type { Annotation, BoundingBox, Point } from '~/types'
import VueKonva from 'vue-konva'
import { getCurrentInstance } from 'vue'

// Register vue-konva
const instance = getCurrentInstance()
if (instance && !instance.appContext.app.component('v-stage')) {
  instance.appContext.app.use(VueKonva)
}

const annotationStore = useAnnotationStore()
const { settings, imageFilter, annotationOpacity, borderWidth, pointRadius } = useCanvasSettings()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<any>(null)
const loadedImage = ref<HTMLImageElement | null>(null)

// Drawing state
const isDrawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const currentRect = ref<BoundingBox | null>(null)
const polygonPoints = ref<Point[]>([])
const tempPolygonPoint = ref<Point | null>(null)

// Pan state
const isPanning = ref(false)
const lastPanPoint = ref({ x: 0, y: 0 })
const isSpacePressed = ref(false)

// Context menu state
const contextMenu = ref({
  isOpen: false,
  position: { x: 0, y: 0 },
  annotationId: null as string | null
})

// Crosshair state
const cursorX = ref(0)
const cursorY = ref(0)
const showCrosshair = ref(false)

// Load image
watch(() => annotationStore.currentImage, async (newImage) => {
  if (!newImage) return
  
  console.log('🖼️ Loading image:', newImage.url)
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.src = newImage.url
  
  img.onload = () => {
    console.log('✅ Image loaded:', img.width, 'x', img.height)
    loadedImage.value = img
  }
  
  img.onerror = (e) => {
    console.error('❌ Failed to load image:', e)
  }
})

// Update canvas size
onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

function updateCanvasSize() {
  if (!containerRef.value) return
  annotationStore.setCanvasSize(
    containerRef.value.clientWidth,
    containerRef.value.clientHeight
  )
}

// Stage config
const stageConfig = computed(() => ({
  width: annotationStore.canvasSize.width,
  height: annotationStore.canvasSize.height,
  x: annotationStore.canvasTransform.x,
  y: annotationStore.canvasTransform.y,
  scaleX: annotationStore.canvasTransform.scale,
  scaleY: annotationStore.canvasTransform.scale
}))

// Get image offset (where image starts on canvas)
const imageOffset = computed(() => ({
  x: (annotationStore.canvasSize.width - annotationStore.scaledImageSize.width) / 2,
  y: (annotationStore.canvasSize.height - annotationStore.scaledImageSize.height) / 2
}))

// Get scale factor (how much image is scaled)
const imageScale = computed(() => {
  if (!annotationStore.currentImage) return 1
  return annotationStore.scaledImageSize.width / annotationStore.currentImage.width
})

// Anchor point size that stays constant on screen regardless of zoom
const anchorPointRadius = computed(() => {
  // Divide by canvas transform scale to keep constant screen size
  return 6 / annotationStore.canvasTransform.scale
})

// Convert screen coordinates to image pixel coordinates
function getPointerPosition(e: any) {
  const stage = stageRef.value?.getNode()
  if (!stage) return null
  
  const pos = stage.getPointerPosition()
  if (!pos) return null
  
  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  const stagePos = transform.point(pos)
  
  // Convert from stage coordinates to image pixel coordinates
  const imagePixelX = (stagePos.x - imageOffset.value.x) / imageScale.value
  const imagePixelY = (stagePos.y - imageOffset.value.y) / imageScale.value
  
  return { x: imagePixelX, y: imagePixelY }
}

// Convert image pixel coordinates to stage coordinates for display
function toStageCoords(imageX: number, imageY: number) {
  return {
    x: imageX * imageScale.value + imageOffset.value.x,
    y: imageY * imageScale.value + imageOffset.value.y
  }
}

// Convert image pixel bbox to stage bbox
function bboxToStage(bbox: BoundingBox) {
  const topLeft = toStageCoords(bbox.x, bbox.y)
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bbox.width * imageScale.value,
    height: bbox.height * imageScale.value
  }
}

// Convert image pixel point to stage point
function pointToStage(point: Point) {
  return toStageCoords(point.x, point.y)
}

// Convert polygon points to stage coordinates
function polygonToStage(points: Point[]): number[] {
  return points.flatMap(p => {
    const stagePoint = toStageCoords(p.x, p.y)
    return [stagePoint.x, stagePoint.y]
  })
}

// Create drag bound function for bbox
function getBboxDragBound(bbox: BoundingBox) {
  return (pos: any) => {
    if (!annotationStore.currentImage) return pos
    
    // Get current offset and scale
    const offset = imageOffset.value
    const scale = imageScale.value
    
    // Convert to image coords
    const imgX = (pos.x - offset.x) / scale
    const imgY = (pos.y - offset.y) / scale
    
    // Constrain
    const constrainedX = Math.max(0, Math.min(imgX, annotationStore.currentImage.width - bbox.width))
    const constrainedY = Math.max(0, Math.min(imgY, annotationStore.currentImage.height - bbox.height))
    
    // Convert back to stage coords
    return {
      x: constrainedX * scale + offset.x,
      y: constrainedY * scale + offset.y
    }
  }
}

// Create drag bound function for point
function getPointDragBound() {
  return (pos: any) => {
    if (!annotationStore.currentImage) return pos
    
    // Get current offset and scale
    const offset = imageOffset.value
    const scale = imageScale.value
    
    // Convert to image coords
    const imgX = (pos.x - offset.x) / scale
    const imgY = (pos.y - offset.y) / scale
    
    // Constrain
    const constrainedX = Math.max(0, Math.min(imgX, annotationStore.currentImage.width))
    const constrainedY = Math.max(0, Math.min(imgY, annotationStore.currentImage.height))
    
    // Convert back to stage coords
    return {
      x: constrainedX * scale + offset.x,
      y: constrainedY * scale + offset.y
    }
  }
}

// ============================================
// BBOX DRAWING
// ============================================
function startBboxDrawing(pos: Point) {
  isDrawing.value = true
  startPoint.value = pos
  currentRect.value = { x: pos.x, y: pos.y, width: 0, height: 0 }
}

function updateBboxDrawing(pos: Point) {
  if (!currentRect.value) return
  currentRect.value = {
    x: Math.min(startPoint.value.x, pos.x),
    y: Math.min(startPoint.value.y, pos.y),
    width: Math.abs(pos.x - startPoint.value.x),
    height: Math.abs(pos.y - startPoint.value.y)
  }
}

function finishBboxDrawing() {
  if (!currentRect.value || !annotationStore.selectedLabelId) return
  
  // Min size check
  if (currentRect.value.width > 5 && currentRect.value.height > 5) {
    const annotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bounding-box',
      labelId: annotationStore.selectedLabelId,
      bbox: { ...currentRect.value },
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskId: '',
      createdBy: ''
    }
    annotationStore.addAnnotation(annotation)
    console.log('✅ Bbox created:', annotation.id)
  }
  
  isDrawing.value = false
  currentRect.value = null
}

// ============================================
// POLYGON DRAWING - Complete Rebuild
// ============================================
const POLYGON_SNAP_RADIUS = 15 // Snap radius in pixels
let lastClickTime = 0
const MIN_CLICK_INTERVAL = 5 // Minimum ms between clicks (prevents accidental double-clicks)

// Calculate distance between two points
const getDistance = (p1: Point, p2: Point): number => {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Check if mouse is hovering near start point (for visual feedback)
const isHoverNearStart = computed(() => {
  if (!tempPolygonPoint.value || polygonPoints.value.length < 3) return false
  const start = polygonPoints.value[0]
  if (!start) return false
  return getDistance(tempPolygonPoint.value, start) <= POLYGON_SNAP_RADIUS
})

// Handle polygon point click
function addPolygonPoint(clickPos: Point) {
  const now = Date.now()
  
  // Prevent too-fast clicks (debounce)
  if (now - lastClickTime < MIN_CLICK_INTERVAL) {
    console.log('⏱️ Click too fast, ignored')
    return
  }
  lastClickTime = now
  
  // Check if we should close the polygon (3+ points and near start)
  if (polygonPoints.value.length >= 3) {
    const start = polygonPoints.value[0]
    if (start && getDistance(clickPos, start) <= POLYGON_SNAP_RADIUS) {
      console.log('🧲 Closing polygon - clicked near start')
      completePolygon()
      return
    }
  }
  
  // Add new point
  const newPoint = { x: clickPos.x, y: clickPos.y }
  polygonPoints.value.push(newPoint)
  console.log(`📍 Point ${polygonPoints.value.length} added at (${Math.round(clickPos.x)}, ${Math.round(clickPos.y)})`)
}

// Complete and save polygon
function completePolygon() {
  if (polygonPoints.value.length < 3) {
    console.warn('Need minimum 3 points')
    resetPolygon()
    return
  }
  
  if (!annotationStore.selectedLabelId) {
    console.warn('No label selected')
    resetPolygon()
    return
  }
  
  // Create annotation
  const newAnnotation: Annotation = {
    id: `polygon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: 'polygon',
    labelId: annotationStore.selectedLabelId,
    polygon: { points: [...polygonPoints.value] },
    visible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskId: '',
    createdBy: ''
  }
  
  annotationStore.addAnnotation(newAnnotation)
  console.log(`✅ Polygon completed: ${polygonPoints.value.length} points`)
  
  resetPolygon()
}

// Reset polygon state
function resetPolygon() {
  polygonPoints.value = []
  tempPolygonPoint.value = null
}

// Cancel polygon (ESC key)
function cancelPolygonDrawing() {
  console.log('❌ Polygon cancelled')
  resetPolygon()
}

// ============================================
// POINT DRAWING
// ============================================
function addPointAnnotation(pos: Point) {
  if (!annotationStore.selectedLabelId) return
  
  const annotation: Annotation = {
    id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'point',
    labelId: annotationStore.selectedLabelId,
    point: { ...pos },
    visible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskId: '',
    createdBy: ''
  }
  
  annotationStore.addAnnotation(annotation)
  console.log('✅ Point created:', annotation.id)
}

// ============================================
// MOUSE HANDLERS
// ============================================
function handleMouseDown(e: any) {
  const stage = e.target.getStage()
  if (!stage) return
  
  // Close context menu on any click
  if (contextMenu.value.isOpen) {
    closeContextMenu()
  }
  
  // Allow drawing on stage or image, but not on annotations
  const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Image'
  
  const pos = stage.getPointerPosition()
  if (!pos) return
  
  const tool = annotationStore.currentTool
  
  // Middle mouse button or Space + click for panning
  if (e.evt.button === 1 || isSpacePressed.value) {
    isPanning.value = true
    lastPanPoint.value = { x: pos.x, y: pos.y }
    stage.container().style.cursor = 'grabbing'
    return
  }
  
  const transformedPos = getPointerPosition(e)
  if (!transformedPos) return
  
  // Polygon tool - allow clicks anywhere (including on points)
  if (tool === 'polygon' && annotationStore.selectedLabelId && e.evt.button === 0) {
    addPolygonPoint(transformedPos)
    return
  }
  
  // Other drawing tools need empty space click and selected label
  if (clickedOnEmpty && annotationStore.selectedLabelId) {
    if (tool === 'bbox') {
      startBboxDrawing(transformedPos)
    } else if (tool === 'point') {
      addPointAnnotation(transformedPos)
    }
  }
  
  // Select tool deselects on empty click
  if (tool === 'select' && clickedOnEmpty) {
    annotationStore.selectAnnotation(null)
  }
}

function handleMouseMove(e: any) {
  const stage = stageRef.value?.getNode()
  if (!stage) return
  
  const pos = stage.getPointerPosition()
  if (!pos) return
  
  // Update crosshair position (raw stage pointer position)
  if (settings.value.crosshair) {
    cursorX.value = pos.x
    cursorY.value = pos.y
    showCrosshair.value = true
  }
  
  // Handle panning
  if (isPanning.value) {
    const dx = pos.x - lastPanPoint.value.x
    const dy = pos.y - lastPanPoint.value.y
    
    annotationStore.setCanvasTransform({
      x: annotationStore.canvasTransform.x + dx,
      y: annotationStore.canvasTransform.y + dy
    })
    
    lastPanPoint.value = { x: pos.x, y: pos.y }
    return
  }
  
  const transformedPos = getPointerPosition(e)
  if (!transformedPos) return
  
  const tool = annotationStore.currentTool
  
  if (tool === 'bbox' && isDrawing.value) {
    updateBboxDrawing(transformedPos)
  } else if (tool === 'polygon' && polygonPoints.value.length > 0) {
    // Update temp point for preview line
    tempPolygonPoint.value = transformedPos
  }
}

function handleMouseUp(e: any) {
  const stage = stageRef.value?.getNode()
  
  // Stop panning
  if (isPanning.value) {
    isPanning.value = false
    if (stage) {
      stage.container().style.cursor = 'default'
    }
    return
  }
  
  if (annotationStore.currentTool === 'bbox' && isDrawing.value) {
    finishBboxDrawing()
  }
}


function handleKeyDown(e: KeyboardEvent) {
  // Space key for panning
  if (e.code === 'Space' && !isSpacePressed.value) {
    e.preventDefault()
    isSpacePressed.value = true
    const stage = stageRef.value?.getNode()
    if (stage) {
      stage.container().style.cursor = 'grab'
    }
    return
  }
  
  if (annotationStore.currentTool === 'polygon') {
    if (e.key === 'Enter') {
      completePolygon()
    } else if (e.key === 'Escape') {
      cancelPolygonDrawing()
    }
  }
}

// ============================================
// CONTEXT MENU
// ============================================
function handleAnnotationRightClick(e: any, annotationId: string) {
  e.evt.preventDefault()
  
  // Get actual mouse position from the browser event
  const mouseX = e.evt.clientX
  const mouseY = e.evt.clientY
  
  openContextMenu(annotationId, mouseX, mouseY)
}

function openContextMenu(annotationId: string, x: number, y: number) {
  contextMenu.value = {
    isOpen: true,
    position: { x, y },
    annotationId
  }
}

function closeContextMenu() {
  contextMenu.value.isOpen = false
  contextMenu.value.annotationId = null
}

function handleContextMenuDelete() {
  if (contextMenu.value.annotationId) {
    annotationStore.deleteAnnotation(contextMenu.value.annotationId)
    closeContextMenu()
  }
}

function handleContextMenuUpdateAttribute(attributeId: string, value: any) {
  if (contextMenu.value.annotationId) {
    const annotation = annotationStore.annotations.find(a => a.id === contextMenu.value.annotationId)
    if (annotation) {
      // Update annotation attributes
      if (!annotation.attributes) {
        annotation.attributes = {}
      }
      annotation.attributes[attributeId] = value
      annotationStore.updateAnnotation(annotation.id, annotation)
    }
  }
}

// Get context menu annotation and label
const contextMenuAnnotation = computed(() => {
  if (!contextMenu.value.annotationId) return null
  return annotationStore.annotations.find(a => a.id === contextMenu.value.annotationId) || null
})

const contextMenuLabel = computed(() => {
  const annotation = contextMenuAnnotation.value
  if (!annotation) return null
  return annotationStore.labels.find(l => l.id === annotation.labelId) as any || null
})

function handleKeyUp(e: KeyboardEvent) {
  // Release space key
  if (e.code === 'Space') {
    isSpacePressed.value = false
    isPanning.value = false
    const stage = stageRef.value?.getNode()
    if (stage) {
      stage.container().style.cursor = 'default'
    }
  }
}

// Keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// ============================================
// ANNOTATION INTERACTIONS
// ============================================
function handleAnnotationClick(annotation: Annotation) {
  if (annotationStore.currentTool === 'select') {
    annotationStore.selectAnnotation(annotation.id)
  }
}

function handleAnnotationDragEnd(annotation: Annotation, e: any) {
  const node = e.target
  const stage = stageRef.value?.getNode()
  if (!stage || !annotationStore.currentImage) return
  
  // Get new position in stage coords
  const stageX = node.x()
  const stageY = node.y()
  
  // Convert back to image pixel coords
  let imageX = (stageX - imageOffset.value.x) / imageScale.value
  let imageY = (stageY - imageOffset.value.y) / imageScale.value
  
  const imgWidth = annotationStore.currentImage.width
  const imgHeight = annotationStore.currentImage.height
  
  if (annotation.type === 'bounding-box' && annotation.bbox) {
    // Constrain bbox within image bounds
    imageX = Math.max(0, Math.min(imageX, imgWidth - annotation.bbox.width))
    imageY = Math.max(0, Math.min(imageY, imgHeight - annotation.bbox.height))
    
    // Update the node position to match constrained position
    const constrainedStage = toStageCoords(imageX, imageY)
    node.x(constrainedStage.x)
    node.y(constrainedStage.y)
    
    annotationStore.updateAnnotation(annotation.id, {
      bbox: {
        ...annotation.bbox,
        x: imageX,
        y: imageY
      }
    })
  } else if (annotation.type === 'point' && annotation.point) {
    // Constrain point within image bounds
    imageX = Math.max(0, Math.min(imageX, imgWidth))
    imageY = Math.max(0, Math.min(imageY, imgHeight))
    
    // Update the node position to match constrained position
    const constrainedStage = toStageCoords(imageX, imageY)
    node.x(constrainedStage.x)
    node.y(constrainedStage.y)
    
    annotationStore.updateAnnotation(annotation.id, {
      point: {
        x: imageX,
        y: imageY
      }
    })
  }
}

// Handle bbox corner resize
function handleBboxCornerDrag(annotation: Annotation, cornerIndex: number, e: any) {
  if (!annotation.bbox || !annotationStore.currentImage) return
  
  const node = e.target
  const stage = stageRef.value?.getNode()
  if (!stage) return
  
  // Get new position in stage coords
  const stageX = node.x()
  const stageY = node.y()
  
  // Convert back to image pixel coords
  let imageX = (stageX - imageOffset.value.x) / imageScale.value
  let imageY = (stageY - imageOffset.value.y) / imageScale.value
  
  const imgWidth = annotationStore.currentImage.width
  const imgHeight = annotationStore.currentImage.height
  
  // Constrain to image bounds
  imageX = Math.max(0, Math.min(imageX, imgWidth))
  imageY = Math.max(0, Math.min(imageY, imgHeight))
  
  const bbox = { ...annotation.bbox }
  
  // Update bbox based on which corner was dragged
  // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
  if (cornerIndex === 0) {
    // Top-left: adjust x, y, width, height
    const newWidth = bbox.x + bbox.width - imageX
    const newHeight = bbox.y + bbox.height - imageY
    bbox.x = imageX
    bbox.y = imageY
    bbox.width = newWidth
    bbox.height = newHeight
  } else if (cornerIndex === 1) {
    // Top-right: adjust y, width, height
    const newHeight = bbox.y + bbox.height - imageY
    bbox.y = imageY
    bbox.width = imageX - bbox.x
    bbox.height = newHeight
  } else if (cornerIndex === 2) {
    // Bottom-right: adjust width, height
    bbox.width = imageX - bbox.x
    bbox.height = imageY - bbox.y
  } else if (cornerIndex === 3) {
    // Bottom-left: adjust x, width, height
    const newWidth = bbox.x + bbox.width - imageX
    bbox.x = imageX
    bbox.width = newWidth
    bbox.height = imageY - bbox.y
  }
  
  // Ensure positive dimensions
  if (bbox.width < 0) {
    bbox.x += bbox.width
    bbox.width = Math.abs(bbox.width)
  }
  if (bbox.height < 0) {
    bbox.y += bbox.height
    bbox.height = Math.abs(bbox.height)
  }
  
  // Ensure bbox stays within image bounds
  bbox.x = Math.max(0, Math.min(bbox.x, imgWidth))
  bbox.y = Math.max(0, Math.min(bbox.y, imgHeight))
  bbox.width = Math.min(bbox.width, imgWidth - bbox.x)
  bbox.height = Math.min(bbox.height, imgHeight - bbox.y)
  
  annotationStore.updateAnnotation(annotation.id, { bbox })
}

// Handle polygon point drag
function handlePolygonPointDrag(annotation: Annotation, pointIndex: number, e: any) {
  if (!annotation.polygon || !annotationStore.currentImage) return
  
  const node = e.target
  const stage = stageRef.value?.getNode()
  if (!stage) return
  
  // Get new position in stage coords
  const stageX = node.x()
  const stageY = node.y()
  
  // Convert back to image pixel coords
  let imageX = (stageX - imageOffset.value.x) / imageScale.value
  let imageY = (stageY - imageOffset.value.y) / imageScale.value
  
  const imgWidth = annotationStore.currentImage.width
  const imgHeight = annotationStore.currentImage.height
  
  // Constrain to image bounds
  imageX = Math.max(0, Math.min(imageX, imgWidth))
  imageY = Math.max(0, Math.min(imageY, imgHeight))
  
  const newPoints = [...annotation.polygon.points]
  newPoints[pointIndex] = { x: imageX, y: imageY }
  
  annotationStore.updateAnnotation(annotation.id, {
    polygon: { points: newPoints }
  })
}

// Get label color
function getLabelColor(labelId: string): string {
  const label = annotationStore.labels.find(l => l.id === labelId)
  return label?.color || '#2563EB'
}

// Zoom with wheel
function handleWheel(e: any) {
  e.evt.preventDefault()
  
  const stage = stageRef.value?.getNode()
  if (!stage) return
  
  const oldScale = annotationStore.canvasTransform.scale
  const pointer = stage.getPointerPosition()
  
  const scaleBy = 1.1
  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
  const clampedScale = Math.max(0.1, Math.min(5, newScale))
  
  const mousePointTo = {
    x: (pointer.x - annotationStore.canvasTransform.x) / oldScale,
    y: (pointer.y - annotationStore.canvasTransform.y) / oldScale
  }
  
  annotationStore.setCanvasTransform({
    scale: clampedScale,
    x: pointer.x - mousePointTo.x * clampedScale,
    y: pointer.y - mousePointTo.y * clampedScale
  })
}

</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-gray-100 dark:bg-gray-900 relative" :style="{ cursor: settings.crosshair ? 'crosshair' : 'default' }">
    <!-- Canvas -->
    <v-stage
      v-if="loadedImage"
      ref="stageRef"
      :config="stageConfig"
      :style="{ filter: imageFilter, cursor: settings.crosshair ? 'crosshair' : 'default' }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      @mouseleave="showCrosshair = false"
    >
      <!-- Main Layer -->
      <v-layer>
        <!-- Background Image -->
        <v-image
          :config="{
            image: loadedImage,
            x: (annotationStore.canvasSize.width - annotationStore.scaledImageSize.width) / 2,
            y: (annotationStore.canvasSize.height - annotationStore.scaledImageSize.height) / 2,
            width: annotationStore.scaledImageSize.width,
            height: annotationStore.scaledImageSize.height
          }"
        />
        
        <!-- Existing Annotations -->
        <template v-for="annotation in annotationStore.annotations" :key="annotation.id">
          <!-- Bounding Box -->
          <v-group>
            <v-rect
              v-if="annotation.type === 'bounding-box' && annotation.bbox && annotation.visible"
              :config="{
                ...bboxToStage(annotation.bbox),
                stroke: getLabelColor(annotation.labelId),
                strokeWidth: annotationStore.selectedAnnotationId === annotation.id ? borderWidth * 1.5 : borderWidth,
                fill: getLabelColor(annotation.labelId) + Math.floor(annotationOpacity * 255).toString(16).padStart(2, '0'),
                draggable: annotationStore.currentTool === 'select'
              }"
              @click="handleAnnotationClick(annotation)"
              @contextmenu="(e: any) => handleAnnotationRightClick(e, annotation.id)"
              @dragmove="(e: any) => handleAnnotationDragEnd(annotation, e)"
            />
            
            <!-- Bbox Label Name -->
            <v-text
              v-if="settings.showClasses && annotation.bbox && annotation.visible"
              :config="{
                x: toStageCoords(annotation.bbox.x, annotation.bbox.y).x,
                y: toStageCoords(annotation.bbox.x, annotation.bbox.y).y - 20,
                text: annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fill: '#ffffff',
                padding: 4,
                align: 'left'
              }"
            />
            <v-rect
              v-if="settings.showClasses && annotation.bbox && annotation.visible"
              :config="{
                x: toStageCoords(annotation.bbox.x, annotation.bbox.y).x,
                y: toStageCoords(annotation.bbox.x, annotation.bbox.y).y - 20,
                width: (annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown').length * 7 + 8,
                height: 18,
                fill: getLabelColor(annotation.labelId),
                cornerRadius: 3
              }"
            />
            <v-text
              v-if="settings.showClasses && annotation.bbox && annotation.visible"
              :config="{
                x: toStageCoords(annotation.bbox.x, annotation.bbox.y).x + 4,
                y: toStageCoords(annotation.bbox.x, annotation.bbox.y).y - 17,
                text: annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fill: '#ffffff',
                align: 'left'
              }"
            />
            
            <!-- Bbox Corner Handles (only when selected) -->
            <template v-if="annotationStore.selectedAnnotationId === annotation.id && annotation.bbox">
              <v-circle
                v-for="(corner, idx) in [
                  toStageCoords(annotation.bbox.x, annotation.bbox.y),
                  toStageCoords(annotation.bbox.x + annotation.bbox.width, annotation.bbox.y),
                  toStageCoords(annotation.bbox.x + annotation.bbox.width, annotation.bbox.y + annotation.bbox.height),
                  toStageCoords(annotation.bbox.x, annotation.bbox.y + annotation.bbox.height)
                ]"
                :key="idx"
                :config="{
                  x: corner.x,
                  y: corner.y,
                  radius: anchorPointRadius,
                  fill: '#ffffff',
                  stroke: getLabelColor(annotation.labelId),
                  strokeWidth: 2 / annotationStore.canvasTransform.scale,
                  draggable: true
                }"
                @dragmove="(e: any) => handleBboxCornerDrag(annotation, idx, e)"
              />
            </template>
          </v-group>
          
          <!-- Polygon -->
          <v-group>
            <v-line
              v-if="annotation.type === 'polygon' && annotation.polygon && annotation.visible"
              :config="{
                points: polygonToStage(annotation.polygon.points),
                stroke: getLabelColor(annotation.labelId),
                strokeWidth: annotationStore.selectedAnnotationId === annotation.id ? borderWidth * 1.5 : borderWidth,
                fill: getLabelColor(annotation.labelId) + Math.floor(annotationOpacity * 255).toString(16).padStart(2, '0'),
                closed: true,
                draggable: false
              }"
              @click="handleAnnotationClick(annotation)"
              @contextmenu="(e: any) => handleAnnotationRightClick(e, annotation.id)"
            />
            
            <!-- Polygon Label Name -->
            <template v-if="settings.showClasses && annotation.polygon && annotation.polygon.points[0] && annotation.visible">
              <v-rect
                :config="{
                  x: toStageCoords(annotation.polygon.points[0].x, annotation.polygon.points[0].y).x,
                  y: toStageCoords(annotation.polygon.points[0].x, annotation.polygon.points[0].y).y - 20,
                  width: (annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown').length * 7 + 8,
                  height: 18,
                  fill: getLabelColor(annotation.labelId),
                  cornerRadius: 3
                }"
              />
              <v-text
                :config="{
                  x: toStageCoords(annotation.polygon.points[0].x, annotation.polygon.points[0].y).x + 4,
                  y: toStageCoords(annotation.polygon.points[0].x, annotation.polygon.points[0].y).y - 17,
                  text: annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown',
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  fill: '#ffffff',
                  align: 'left'
                }"
              />
            </template>
            
            <!-- Polygon Point Handles (only when selected) -->
            <template v-if="annotationStore.selectedAnnotationId === annotation.id && annotation.polygon">
              <v-circle
                v-for="(point, idx) in annotation.polygon.points"
                :key="idx"
                :config="{
                  ...pointToStage(point),
                  radius: anchorPointRadius,
                  fill: '#ffffff',
                  stroke: getLabelColor(annotation.labelId),
                  strokeWidth: 2 / annotationStore.canvasTransform.scale,
                  draggable: true
                }"
                @dragmove="(e: any) => handlePolygonPointDrag(annotation, idx, e)"
              />
            </template>
          </v-group>
          
          <!-- Point -->
          <v-group>
            <v-circle
              v-if="annotation.type === 'point' && annotation.point && annotation.visible"
              :config="{
                ...pointToStage(annotation.point),
                radius: pointRadius,
                fill: getLabelColor(annotation.labelId),
                stroke: '#ffffff',
                strokeWidth: borderWidth,
                draggable: annotationStore.currentTool === 'select'
              }"
              @click="handleAnnotationClick(annotation)"
              @contextmenu="(e: any) => handleAnnotationRightClick(e, annotation.id)"
              @dragmove="(e: any) => handleAnnotationDragEnd(annotation, e)"
            />
            
            <!-- Point Label Name -->
            <v-rect
              v-if="settings.showClasses && annotation.point && annotation.visible"
              :config="{
                x: toStageCoords(annotation.point.x, annotation.point.y).x + 10,
                y: toStageCoords(annotation.point.x, annotation.point.y).y - 10,
                width: (annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown').length * 7 + 8,
                height: 18,
                fill: getLabelColor(annotation.labelId),
                cornerRadius: 3
              }"
            />
            <v-text
              v-if="settings.showClasses && annotation.point && annotation.visible"
              :config="{
                x: toStageCoords(annotation.point.x, annotation.point.y).x + 14,
                y: toStageCoords(annotation.point.x, annotation.point.y).y - 7,
                text: annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fill: '#ffffff',
                align: 'left'
              }"
            />
          </v-group>
        </template>
        
        <!-- Current Drawing: Bbox -->
        <v-rect
          v-if="currentRect && annotationStore.currentTool === 'bbox'"
          :config="{
            ...bboxToStage(currentRect),
            stroke: annotationStore.currentLabel?.color || '#2563EB',
            strokeWidth: 2,
            fill: (annotationStore.currentLabel?.color || '#2563EB') + '20',
            dash: [5, 5]
          }"
        />
        
        <!-- Current Drawing: Polygon -->
        <template v-if="annotationStore.currentTool === 'polygon' && polygonPoints.length > 0">
          <!-- Polygon lines -->
          <v-line
            v-if="polygonPoints.length > 0"
            :config="{
              points: polygonToStage(tempPolygonPoint ? [...polygonPoints, tempPolygonPoint] : polygonPoints),
              stroke: annotationStore.currentLabel?.color || '#2563EB',
              strokeWidth: 2,
              fill: (annotationStore.currentLabel?.color || '#2563EB') + '20',
              closed: false,
              dash: [5, 5]
            }"
          />
          
          <!-- Polygon points -->
          <v-circle
            v-for="(point, index) in polygonPoints"
            :key="index"
            :config="{
              ...pointToStage(point),
              radius: index === 0 && isHoverNearStart ? 8 : 4,
              fill: annotationStore.currentLabel?.color || '#2563EB',
              stroke: '#ffffff',
              strokeWidth: index === 0 && isHoverNearStart ? 3 : 2
            }"
          />
        </template>
      </v-layer>
      
    </v-stage>
    
    <!-- Crosshair Overlay (HTML/CSS) -->
    <div
      v-if="settings.crosshair && showCrosshair && loadedImage"
      class="absolute inset-0 pointer-events-none"
      :style="{
        '--cursor-x': cursorX + 'px',
        '--cursor-y': cursorY + 'px'
      }"
    >
      <!-- Vertical line -->
      <div
        class="absolute top-0 bottom-0 w-px"
        :style="{ 
          left: 'var(--cursor-x)',
          background: 'repeating-linear-gradient(to bottom, #22d3ee 0px, #22d3ee 5px, transparent 5px, transparent 10px)'
        }"
      />
      <!-- Horizontal line -->
      <div
        class="absolute left-0 right-0 h-px"
        :style="{ 
          top: 'var(--cursor-y)',
          background: 'repeating-linear-gradient(to right, #22d3ee 0px, #22d3ee 5px, transparent 5px, transparent 10px)'
        }"
      />
    </div>
    
    <!-- No Image State -->
    <div v-else-if="!loadedImage" class="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <p>No image loaded</p>
    </div>
    
    <!-- Context Menu -->
    <AnnotationContextMenu
      :annotation="contextMenuAnnotation"
      :label="contextMenuLabel"
      :position="contextMenu.position"
      :is-open="contextMenu.isOpen"
      @close="closeContextMenu"
      @delete="handleContextMenuDelete"
      @update-attribute="handleContextMenuUpdateAttribute"
    />
  </div>
</template>
