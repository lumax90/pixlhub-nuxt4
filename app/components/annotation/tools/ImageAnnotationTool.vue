<script setup lang="ts">
import type { Annotation, BoundingBox, Point } from '~/types'
import VueKonva from 'vue-konva'
import { getCurrentInstance } from 'vue'

// Register vue-konva only once globally
const instance = getCurrentInstance()
if (instance) {
  const app = instance.appContext.app
  // Check if plugin is already installed by checking for a custom property
  if (!app.config.globalProperties.$konvaInstalled) {
    app.use(VueKonva)
    app.config.globalProperties.$konvaInstalled = true
  }
}

const annotationStore = useAnnotationStore()
const commentStore = useCommentStore()
const { settings, imageFilter, annotationOpacity, borderWidth, pointRadius } = useCanvasSettings()

// Performance optimization: Map for O(1) annotation lookups
const annotationById = computed(() => {
  const map = new Map()
  for (const a of annotationStore.annotations) {
    map.set(a.id, a)
  }
  return map
})

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

// Last drawing tool (for Tab key toggle)
const lastDrawingTool = ref<'bbox' | 'polygon' | 'line' | 'freeform' | 'point'>('bbox')

// Freeform drawing state
const freeformPoints = ref<Point[]>([])
const isDrawingFreeform = ref(false)

// Line drawing state
const linePoints = ref<Point[]>([])
const tempLinePoint = ref<Point | null>(null)

// Pan state
const isPanning = ref(false)
const lastPanPoint = ref({ x: 0, y: 0 })
const isSpacePressed = ref(false)

// Polygon editing state
const isCtrlPressed = ref(false)
const ghostPoint = ref<{ position: Point; segmentIndex: number; annotationId: string } | null>(null)
const hoveredPointIndex = ref<{ annotationId: string; pointIndex: number } | null>(null)

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

// Cursor position in image pixel coordinates
const cursorImageX = ref(0)
const cursorImageY = ref(0)

// Info display for cursor position and box size
const infoDisplay = computed(() => {
  if (!loadedImage.value) return null
  
  const x = Math.round(cursorImageX.value)
  const y = Math.round(cursorImageY.value)
  
  // Show box size while drawing
  if (isDrawing.value && currentRect.value && annotationStore.currentTool === 'bbox') {
    const w = Math.round(currentRect.value.width)
    const h = Math.round(currentRect.value.height)
    return `${x}, ${y} | ${w} × ${h} px`
  }
  
  // Show selected annotation dimensions
  if (annotationStore.selectedAnnotationId) {
    const annotation = annotationById.value.get(annotationStore.selectedAnnotationId)
    if (annotation) {
      if (annotation.bbox) {
        const w = Math.round(annotation.bbox.width)
        const h = Math.round(annotation.bbox.height)
        return `${x}, ${y} | ${w} × ${h} px`
      }
      if (annotation.polygon && annotation.polygon.points.length > 0) {
        // Calculate polygon bounding box
        const points = annotation.polygon.points
        const xs = points.map((p: Point) => p.x)
        const ys = points.map((p: Point) => p.y)
        const w = Math.round(Math.max(...xs) - Math.min(...xs))
        const h = Math.round(Math.max(...ys) - Math.min(...ys))
        return `${x}, ${y} | ${w} × ${h} px`
      }
    }
  }
  
  // Just show cursor position
  return `${x}, ${y}`
})

// Load image
watch(() => annotationStore.currentImage, async (newImage, oldImage) => {
  if (!newImage) return
  
  // Skip if same image (prevents duplicate loads)
  if (oldImage && newImage.url === oldImage.url) return
  
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.src = newImage.url
  
  img.onload = () => {
    // Clear old image before setting new one
    if (loadedImage.value) {
      loadedImage.value = null
    }
    loadedImage.value = img
  }
  
  img.onerror = () => {
    // Silently handle errors (usually from component unmounting during load)
    // Image will retry on next task load
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

// Cursor style based on tool
const cursorStyle = computed(() => {
  // Panning mode (space key held)
  if (isSpacePressed.value) {
    return isPanning.value ? 'grabbing' : 'grab'
  }
  
  // Tool-specific cursors
  if (annotationStore.currentTool === 'bbox') {
    return 'crosshair'
  }
  if (annotationStore.currentTool === 'polygon') {
    return 'crosshair'
  }
  if (annotationStore.currentTool === 'line') {
    return 'crosshair'
  }
  if (annotationStore.currentTool === 'freeform') {
    return 'crosshair'
  }
  if (annotationStore.currentTool === 'point') {
    return 'crosshair'
  }
  if (annotationStore.currentTool === 'select') {
    return 'default'
  }
  if (annotationStore.currentTool === 'comment') {
    return 'help'
  }
  
  // Fallback to crosshair setting
  if (settings.value.crosshair) {
    return 'crosshair'
  }
  
  return 'default'
})

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

// Clamp point to image bounds
function clampToImageBounds(point: Point): Point {
  if (!annotationStore.currentImage) return point
  
  return {
    x: Math.max(0, Math.min(point.x, annotationStore.currentImage.width)),
    y: Math.max(0, Math.min(point.y, annotationStore.currentImage.height))
  }
}

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
  // Clamp start position to image bounds
  const clampedPos = clampToImageBounds(pos)
  
  isDrawing.value = true
  startPoint.value = clampedPos
  currentRect.value = { x: clampedPos.x, y: clampedPos.y, width: 0, height: 0 }
}

function updateBboxDrawing(pos: Point) {
  if (!currentRect.value) return
  
  // Clamp position to image bounds
  const clampedPos = clampToImageBounds(pos)
  
  currentRect.value = {
    x: Math.min(startPoint.value.x, clampedPos.x),
    y: Math.min(startPoint.value.y, clampedPos.y),
    width: Math.abs(clampedPos.x - startPoint.value.x),
    height: Math.abs(clampedPos.y - startPoint.value.y)
  }
}

function finishBboxDrawing() {
  if (!currentRect.value || !annotationStore.selectedLabelId) return
  
  // Min size check
  if (currentRect.value.width > 5 && currentRect.value.height > 5) {
    // AI polygon mode removed - will be reimplemented later
    if (false) {
      // Placeholder for future AI implementation
    } else {
      // Regular bbox annotation
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
    }
  }
  
  isDrawing.value = false
  currentRect.value = null
}

// ============================================
// POLYGON DRAWING - Complete Rebuild
// ============================================
const POLYGON_SNAP_RADIUS = 15 // Snap radius in pixels
let lastClickTime = 0
const MIN_CLICK_INTERVAL = 50 // Minimum ms between clicks (prevents accidental double-clicks)

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
  
  // Clamp position to image bounds
  const clampedPos = clampToImageBounds(clickPos)
  
  // Check if we should close the polygon (3+ points and near start)
  if (polygonPoints.value.length >= 3) {
    const start = polygonPoints.value[0]
    if (start && getDistance(clampedPos, start) <= POLYGON_SNAP_RADIUS) {
      console.log('🧲 Closing polygon - clicked near start')
      completePolygon()
      return
    }
  }
  
  // Add new point
  const newPoint = { x: clampedPos.x, y: clampedPos.y }
  polygonPoints.value.push(newPoint)
  console.log(`📍 Point ${polygonPoints.value.length} added at (${Math.round(clampedPos.x)}, ${Math.round(clampedPos.y)})`)
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
// FREEFORM DRAWING (Segmentation Mask)
// ============================================
// Invert density: higher density = smaller distance = more points
// Density 1 = 10px distance, Density 10 = 1px distance
const freeformSampleDistance = computed(() => 11 - settings.value.freeformDensity)

// Start freeform drawing
function startFreeformDrawing(pos: Point) {
  if (!annotationStore.selectedLabelId) return
  
  // Clamp start position to image bounds
  const clampedPos = clampToImageBounds(pos)
  
  isDrawingFreeform.value = true
  freeformPoints.value = [{ ...clampedPos }]
  console.log('🖊️ Started freeform drawing')
}

// Continue freeform drawing
function continueFreeformDrawing(pos: Point) {
  if (!isDrawingFreeform.value || freeformPoints.value.length === 0) return
  
  // Clamp position to image bounds
  const clampedPos = clampToImageBounds(pos)
  
  // Only add point if it's far enough from the last point (smoothing)
  const lastPoint = freeformPoints.value[freeformPoints.value.length - 1]
  if (!lastPoint) return
  
  const distance = getDistance(clampedPos, lastPoint)
  
  if (distance >= freeformSampleDistance.value) {
    freeformPoints.value.push({ ...clampedPos })
  }
}

// Complete freeform drawing
function completeFreeformDrawing() {
  if (!isDrawingFreeform.value || freeformPoints.value.length < 3) {
    console.warn('Need minimum 3 points for freeform')
    resetFreeform()
    return
  }
  
  if (!annotationStore.selectedLabelId) {
    console.warn('No label selected')
    resetFreeform()
    return
  }
  
  // Simplify the path using density setting as tolerance
  // Higher density = more aggressive simplification = fewer points
  const simplifiedPoints = simplifyPath(freeformPoints.value, freeformSampleDistance.value)
  
  // Create segmentation annotation
  const newAnnotation: Annotation = {
    id: `freeform-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: 'polygon', // Use polygon type for segmentation masks
    labelId: annotationStore.selectedLabelId,
    polygon: { points: simplifiedPoints },
    visible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskId: '',
    createdBy: ''
  }
  
  annotationStore.addAnnotation(newAnnotation)
  
  resetFreeform()
}

// Reset freeform state
function resetFreeform() {
  freeformPoints.value = []
  isDrawingFreeform.value = false
}

// ============================================
// LINE DRAWING (Polyline - like polygon but doesn't close)
// ============================================
function addLinePoint(clickPos: Point) {
  const now = Date.now()
  
  // Prevent too-fast clicks (debounce)
  if (now - lastClickTime < MIN_CLICK_INTERVAL) {
    console.log('⏱️ Click too fast, ignored')
    return
  }
  lastClickTime = now
  
  // Clamp position to image bounds
  const clampedPos = clampToImageBounds(clickPos)
  
  // Add new point
  const newPoint = { x: clampedPos.x, y: clampedPos.y }
  linePoints.value.push(newPoint)
  console.log(`📏 Point ${linePoints.value.length} added at (${Math.round(clampedPos.x)}, ${Math.round(clampedPos.y)})`)
}

// Complete and save line (Enter key)
function completeLine() {
  if (linePoints.value.length < 2) {
    console.warn('Need minimum 2 points for line')
    resetLine()
    return
  }
  
  if (!annotationStore.selectedLabelId) {
    console.warn('No label selected')
    resetLine()
    return
  }
  
  const annotation: any = {
    id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'line',
    labelId: annotationStore.selectedLabelId,
    line: {
      points: linePoints.value.map(p => ({ ...p }))
    },
    visible: true
  }
  
  annotationStore.addAnnotation(annotation)
  
  resetLine()
}

// Reset line state
function resetLine() {
  linePoints.value = []
  tempLinePoint.value = null
}

// Cancel line drawing (ESC key)
function cancelLineDrawing() {
  console.log('❌ Line drawing cancelled')
  resetLine()
}

// ============================================
// LINE POINT EDITING
// ============================================
// Handle line point drag
function handleLinePointDrag(annotation: Annotation, pointIndex: number, e: any) {
  if (!annotation.line || !annotationStore.currentImage) return
  
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
  
  const newPoints = [...annotation.line.points]
  newPoints[pointIndex] = { x: imageX, y: imageY }
  
  annotationStore.updateAnnotation(annotation.id, {
    line: { points: newPoints }
  })
}

// Delete line point (right-click)
function deleteLinePoint(annotation: Annotation, pointIndex: number) {
  if (!annotation.line || annotation.line.points.length <= 2) {
    console.warn('Cannot delete point - line needs minimum 2 points')
    return
  }
  
  const newPoints = annotation.line.points.filter((_, idx) => idx !== pointIndex)
  annotationStore.updateAnnotation(annotation.id, {
    line: { points: newPoints }
  })
  console.log(`🗑️ Deleted point ${pointIndex} from line`)
}

// ============================================
// COMMENT PLACEMENT
// ============================================
function placeComment(pos: Point) {
  if (!annotationStore.currentImage) return
  
  // pos is already in image pixel coordinates from getPointerPosition
  // Just convert to percentage (0-100) of image dimensions
  const percentX = (pos.x / annotationStore.currentImage.width) * 100
  const percentY = (pos.y / annotationStore.currentImage.height) * 100
  
  // Start adding comment at this position
  commentStore.startAddingComment({ x: percentX, y: percentY })
  console.log('📍 Comment marker placed at:', percentX.toFixed(1) + '%', percentY.toFixed(1) + '%')
  console.log('📍 Image coords:', pos.x.toFixed(1), pos.y.toFixed(1))
}

function handleCommentClick(commentId: string) {
  commentStore.setActiveComment(commentId)
  console.log('💬 Comment clicked:', commentId)
}

// ============================================
// AI-ASSISTED POLYGON FROM BOX (REMOVED - TO BE REIMPLEMENTED)
// ============================================
// AI features removed temporarily - will be rebuilt from scratch later

// Simplify path using Ramer-Douglas-Peucker algorithm
function simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points
  
  // Find the point with maximum distance from line between first and last
  let maxDistance = 0
  let maxIndex = 0
  const first = points[0]
  const last = points[points.length - 1]
  
  if (!first || !last) return points
  
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i]
    if (!point) continue
    const distance = perpendicularDistance(point, first, last)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPath(points.slice(maxIndex), tolerance)
    return [...left.slice(0, -1), ...right]
  } else {
    return [first, last]
  }
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const norm = Math.sqrt(dx * dx + dy * dy)
  
  if (norm === 0) return getDistance(point, lineStart)
  
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / norm
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
  
  // Ctrl+click to insert point on selected polygon
  if (isCtrlPressed.value && ghostPoint.value && e.evt.button === 0) {
    const annotation = annotationById.value.get(ghostPoint.value!.annotationId)
    if (annotation) {
      insertPolygonPoint(annotation, ghostPoint.value.segmentIndex, ghostPoint.value.position)
      ghostPoint.value = null
    }
    return
  }
  
  // Check if clicked on an anchor point (to prevent adding points when clicking on existing points)
  const clickedOnAnchorPoint = e.target.getClassName() === 'Circle' && e.target.attrs.draggable === true
  
  // Polygon tool - left click adds point, right click removes last point
  if (tool === 'polygon' && annotationStore.selectedLabelId) {
    if (e.evt.button === 0 && !clickedOnAnchorPoint) {
      // Left click - add point
      addPolygonPoint(transformedPos)
      return
    } else if (e.evt.button === 2 && polygonPoints.value.length > 0) {
      // Right click - remove last point
      e.evt.preventDefault()
      polygonPoints.value.pop()
      console.log('🔙 Removed last polygon point')
      return
    }
  }
  
  // Line tool - left click adds point, right click removes last point
  if (tool === 'line' && annotationStore.selectedLabelId) {
    if (e.evt.button === 0 && !clickedOnAnchorPoint) {
      // Left click - add point
      addLinePoint(transformedPos)
      return
    } else if (e.evt.button === 2 && linePoints.value.length > 0) {
      // Right click - remove last point
      e.evt.preventDefault()
      linePoints.value.pop()
      console.log('🔙 Removed last line point')
      return
    }
  }
  
  // Comment tool - place comment marker
  if (tool === 'comment' && clickedOnEmpty && e.evt.button === 0) {
    placeComment(transformedPos)
    return
  }
  
  // Other drawing tools need empty space click and selected label
  if (clickedOnEmpty && annotationStore.selectedLabelId) {
    if (tool === 'bbox') {
      startBboxDrawing(transformedPos)
    } else if (tool === 'point') {
      addPointAnnotation(transformedPos)
    } else if (tool === 'freeform') {
      startFreeformDrawing(transformedPos)
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
  
  // Update cursor position in image coordinates
  const imagePos = getPointerPosition(e)
  if (imagePos) {
    cursorImageX.value = imagePos.x
    cursorImageY.value = imagePos.y
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
  
  // Show ghost point when Ctrl is pressed over a selected polygon
  if (isCtrlPressed.value && annotationStore.selectedAnnotationId) {
    const selectedAnnotation = annotationById.value.get(annotationStore.selectedAnnotationId)
    if (selectedAnnotation && selectedAnnotation.type === 'polygon') {
      const result = findClosestPointOnPolygonEdge(selectedAnnotation, transformedPos)
      if (result) {
        ghostPoint.value = {
          position: result.position,
          segmentIndex: result.segmentIndex,
          annotationId: selectedAnnotation.id
        }
      } else {
        ghostPoint.value = null
      }
    } else {
      ghostPoint.value = null
    }
  } else {
    ghostPoint.value = null
  }
  
  if (tool === 'bbox' && isDrawing.value) {
    updateBboxDrawing(transformedPos)
  } else if (tool === 'line' && linePoints.value.length > 0) {
    // Update temp point for preview line (clamped to image bounds)
    tempLinePoint.value = clampToImageBounds(transformedPos)
  } else if (tool === 'polygon' && polygonPoints.value.length > 0) {
    // Update temp point for preview line (clamped to image bounds)
    tempPolygonPoint.value = clampToImageBounds(transformedPos)
  } else if (tool === 'freeform' && isDrawingFreeform.value) {
    // Continue drawing freeform path
    continueFreeformDrawing(transformedPos)
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
  } else if (annotationStore.currentTool === 'freeform' && isDrawingFreeform.value) {
    completeFreeformDrawing()
  }
}


function handleKeyDown(e: KeyboardEvent) {
  // Tab key to toggle between select and last drawing tool
  if (e.key === 'Tab') {
    e.preventDefault()
    if (annotationStore.currentTool === 'select') {
      // Switch to last drawing tool
      annotationStore.setTool(lastDrawingTool.value)
    } else {
      // Switch to select mode
      annotationStore.setTool('select')
    }
    return
  }
  
  // Ctrl key for polygon point insertion
  if ((e.key === 'Control' || e.key === 'Meta') && !isCtrlPressed.value) {
    isCtrlPressed.value = true
    return
  }
  
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
  
  if (annotationStore.currentTool === 'line') {
    if (e.key === 'Enter') {
      completeLine()
    } else if (e.key === 'Escape') {
      cancelLineDrawing()
    }
  }
}

// ============================================
// CONTEXT MENU
// ============================================
function handleAnnotationRightClick(e: any, annotationId: string) {
  e.evt.preventDefault()
  
  // Close existing context menu if open
  if (contextMenu.value.isOpen) {
    closeContextMenu()
  }
  
  // Select the annotation first
  annotationStore.selectAnnotation(annotationId)
  
  // Get actual mouse position from the browser event
  const mouseX = e.evt.clientX
  const mouseY = e.evt.clientY
  
  // Open context menu on next tick to ensure clean state
  nextTick(() => {
    openContextMenu(annotationId, mouseX, mouseY)
  })
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
    const annotation = annotationById.value.get(contextMenu.value.annotationId)
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
  return annotationById.value.get(contextMenu.value.annotationId) || null
})

const contextMenuLabel = computed(() => {
  const annotation = contextMenuAnnotation.value
  if (!annotation) return null
  return annotationStore.labels.find(l => l.id === annotation.labelId) as any || null
})

function handleKeyUp(e: KeyboardEvent) {
  // Release Ctrl key
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = false
    ghostPoint.value = null
  }
  
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

// Track last drawing tool when tool changes
watch(() => annotationStore.currentTool, (newTool) => {
  if (newTool && newTool !== 'select' && newTool !== 'comment') {
    lastDrawingTool.value = newTool as 'bbox' | 'polygon' | 'freeform' | 'point'
  }
})

// Keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  
  // Destroy Konva stage to free memory
  const stage = stageRef.value?.getNode()
  if (stage) {
    stage.destroy()
  }
  
  // Clear image reference
  if (loadedImage.value) {
    loadedImage.value.src = ''
    loadedImage.value = null
  }
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

// ============================================
// POLYGON POINT EDITING
// ============================================
// Delete polygon point (right-click)
function deletePolygonPoint(annotation: Annotation, pointIndex: number) {
  if (!annotation.polygon || annotation.polygon.points.length <= 3) {
    console.warn('Cannot delete point - polygon needs minimum 3 points')
    return
  }
  
  const newPoints = annotation.polygon.points.filter((_, idx) => idx !== pointIndex)
  annotationStore.updateAnnotation(annotation.id, {
    polygon: { points: newPoints }
  })
  console.log(`🗑️ Deleted point ${pointIndex} from polygon`)
}

// Add polygon point to existing polygon (Ctrl+click on edge)
function insertPolygonPoint(annotation: Annotation, segmentIndex: number, newPoint: Point) {
  if (!annotation.polygon) return
  
  const newPoints = [...annotation.polygon.points]
  // Insert new point after the segment start point
  newPoints.splice(segmentIndex + 1, 0, newPoint)
  
  annotationStore.updateAnnotation(annotation.id, {
    polygon: { points: newPoints }
  })
  console.log(`➕ Added point to polygon at segment ${segmentIndex}`)
}

// Find closest point on polygon edge
function findClosestPointOnPolygonEdge(annotation: Annotation, mousePos: Point): { position: Point; segmentIndex: number } | null {
  if (!annotation.polygon || annotation.polygon.points.length < 2) return null
  
  const points = annotation.polygon.points
  let closestPoint: Point | null = null
  let closestDistance = Infinity
  let closestSegmentIndex = 0
  
  // Check each edge
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length] // Wrap around to first point
    
    if (!p1 || !p2) continue
    
    // Find closest point on this line segment
    const pointOnSegment = closestPointOnLineSegment(mousePos, p1, p2)
    const distance = getDistance(mousePos, pointOnSegment)
    
    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = pointOnSegment
      closestSegmentIndex = i
    }
  }
  
  // Only show ghost point if mouse is close enough (within 10 pixels)
  if (closestPoint && closestDistance < 10) {
    return { position: closestPoint, segmentIndex: closestSegmentIndex }
  }
  
  return null
}

// Get closest point on a line segment
function closestPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point): Point {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lengthSquared = dx * dx + dy * dy
  
  if (lengthSquared === 0) return lineStart
  
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
  t = Math.max(0, Math.min(1, t))
  
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
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
  <div ref="containerRef" class="w-full h-full bg-gray-100 dark:bg-gray-900 relative" :style="{ cursor: cursorStyle }">
    <!-- Canvas -->
    <v-stage
      v-if="loadedImage"
      ref="stageRef"
      :config="stageConfig"
      :style="{ filter: imageFilter, cursor: cursorStyle }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      @mouseleave="showCrosshair = false"
      @contextmenu="(e: any) => e.evt.preventDefault()"
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
                  radius: hoveredPointIndex?.annotationId === annotation.id && hoveredPointIndex?.pointIndex === idx 
                    ? anchorPointRadius * 1.4 
                    : anchorPointRadius,
                  fill: hoveredPointIndex?.annotationId === annotation.id && hoveredPointIndex?.pointIndex === idx 
                    ? '#ff4444' 
                    : '#ffffff',
                  stroke: getLabelColor(annotation.labelId),
                  strokeWidth: 2 / annotationStore.canvasTransform.scale,
                  draggable: true
                }"
                @dragmove="(e: any) => handlePolygonPointDrag(annotation, idx, e)"
                @contextmenu="(e: any) => { e.evt.preventDefault(); deletePolygonPoint(annotation, idx); }"
                @mouseenter="() => hoveredPointIndex = { annotationId: annotation.id, pointIndex: idx }"
                @mouseleave="() => hoveredPointIndex = null"
              />
              
              <!-- Ghost point for insertion (when Ctrl is pressed) -->
              <v-circle
                v-if="ghostPoint && ghostPoint.annotationId === annotation.id"
                :config="{
                  ...pointToStage(ghostPoint.position),
                  radius: anchorPointRadius,
                  fill: '#00ff00',
                  stroke: '#ffffff',
                  strokeWidth: 2 / annotationStore.canvasTransform.scale
                }"
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
          
          <!-- Line (Polyline) -->
          <v-group>
            <v-line
              v-if="annotation.type === 'line' && annotation.line && annotation.line.points && annotation.visible"
              :config="{
                points: polygonToStage(annotation.line.points),
                stroke: getLabelColor(annotation.labelId),
                strokeWidth: annotationStore.selectedAnnotationId === annotation.id ? borderWidth * 1.5 : borderWidth,
                lineCap: 'round',
                lineJoin: 'round'
              }"
              @click="handleAnnotationClick(annotation)"
              @contextmenu="(e: any) => handleAnnotationRightClick(e, annotation.id)"
            />
            
            <!-- Line point handles (when selected) -->
            <template v-if="annotationStore.selectedAnnotationId === annotation.id && annotation.line">
              <v-circle
                v-for="(point, idx) in annotation.line.points"
                :key="idx"
                :config="{
                  ...pointToStage(point),
                  radius: hoveredPointIndex?.annotationId === annotation.id && hoveredPointIndex?.pointIndex === idx 
                    ? anchorPointRadius * 1.4 
                    : anchorPointRadius,
                  fill: hoveredPointIndex?.annotationId === annotation.id && hoveredPointIndex?.pointIndex === idx 
                    ? '#ff4444' 
                    : '#ffffff',
                  stroke: getLabelColor(annotation.labelId),
                  strokeWidth: 2 / annotationStore.canvasTransform.scale,
                  draggable: true
                }"
                @dragmove="(e: any) => handleLinePointDrag(annotation, idx, e)"
                @contextmenu="(e: any) => { e.evt.preventDefault(); deleteLinePoint(annotation, idx); }"
                @mouseenter="() => hoveredPointIndex = { annotationId: annotation.id, pointIndex: idx }"
                @mouseleave="() => hoveredPointIndex = null"
              />
            </template>
            
            <!-- Line Label Name (at first point) -->
            <template v-if="settings.showClasses && annotation.line && annotation.line.points && annotation.line.points[0] && annotation.visible">
              <v-rect
                :config="{
                  x: toStageCoords(annotation.line.points[0]!.x, annotation.line.points[0]!.y).x + 5,
                  y: toStageCoords(annotation.line.points[0]!.x, annotation.line.points[0]!.y).y - 10,
                  width: (annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown').length * 7 + 8,
                  height: 18,
                  fill: getLabelColor(annotation.labelId),
                  cornerRadius: 3
                }"
              />
              <v-text
                :config="{
                  x: toStageCoords(annotation.line.points[0]!.x, annotation.line.points[0]!.y).x + 9,
                  y: toStageCoords(annotation.line.points[0]!.x, annotation.line.points[0]!.y).y - 7,
                  text: annotationStore.labels.find(l => l.id === annotation.labelId)?.name || 'Unknown',
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  fill: '#ffffff',
                  align: 'left'
                }"
              />
            </template>
          </v-group>
        </template>
        
        <!-- Current Drawing: Bbox -->
        <v-rect
          v-if="currentRect && annotationStore.currentTool === 'bbox'"
          :config="{
            ...bboxToStage(currentRect),
            stroke: annotationStore.currentLabel?.color || '#2563EB',
            strokeWidth: borderWidth,
            fill: (annotationStore.currentLabel?.color || '#2563EB') + '20',
            dash: [5, 5]
          }"
        />
        
        <!-- Current Drawing: Line (Polyline) -->
        <template v-if="annotationStore.currentTool === 'line' && linePoints.length > 0">
          <!-- Line segments -->
          <v-line
            :config="{
              points: polygonToStage(tempLinePoint ? [...linePoints, tempLinePoint] : linePoints),
              stroke: annotationStore.currentLabel?.color || '#2563EB',
              strokeWidth: borderWidth,
              lineCap: 'round',
              lineJoin: 'round',
              dash: [5, 5]
            }"
          />
          
          <!-- Line points -->
          <v-circle
            v-for="(point, index) in linePoints"
            :key="index"
            :config="{
              ...pointToStage(point),
              radius: 4 / annotationStore.canvasTransform.scale,
              fill: annotationStore.currentLabel?.color || '#2563EB',
              stroke: '#ffffff',
              strokeWidth: 2 / annotationStore.canvasTransform.scale
            }"
          />
        </template>
        
        <!-- Current Drawing: Polygon -->
        <template v-if="annotationStore.currentTool === 'polygon' && polygonPoints.length > 0">
          <!-- Polygon lines -->
          <v-line
            v-if="polygonPoints.length > 0"
            :config="{
              points: polygonToStage(tempPolygonPoint ? [...polygonPoints, tempPolygonPoint] : polygonPoints),
              stroke: annotationStore.currentLabel?.color || '#2563EB',
              strokeWidth: borderWidth,
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
              radius: index === 0 && isHoverNearStart ? anchorPointRadius * 1.33 : anchorPointRadius,
              fill: annotationStore.currentLabel?.color || '#2563EB',
              stroke: '#ffffff',
              strokeWidth: 2 / annotationStore.canvasTransform.scale
            }"
          />
        </template>
        
        <!-- Current Drawing: Freeform -->
        <template v-if="annotationStore.currentTool === 'freeform' && isDrawingFreeform && freeformPoints.length > 0">
          <!-- Main drawing path -->
          <v-line
            :config="{
              points: polygonToStage(freeformPoints),
              stroke: annotationStore.currentLabel?.color || '#2563EB',
              strokeWidth: borderWidth,
              fill: (annotationStore.currentLabel?.color || '#2563EB') + '20',
              closed: false,
              lineCap: 'round',
              lineJoin: 'round',
              tension: 0.2
            }"
          />
          
          <!-- Closing line preview (dashed line from last point to first point) -->
          <v-line
            v-if="freeformPoints.length >= 3"
            :config="{
              points: polygonToStage([freeformPoints[freeformPoints.length - 1]!, freeformPoints[0]!]),
              stroke: annotationStore.currentLabel?.color || '#2563EB',
              strokeWidth: 1.5,
              dash: [8, 4],
              opacity: 0.6,
              lineCap: 'round'
            }"
          />
          
          <!-- Start point indicator (larger circle) -->
          <v-circle
            v-if="freeformPoints[0]"
            :config="{
              ...pointToStage(freeformPoints[0]),
              radius: anchorPointRadius * 1.5,
              fill: annotationStore.currentLabel?.color || '#2563EB',
              stroke: '#ffffff',
              strokeWidth: 2 / annotationStore.canvasTransform.scale
            }"
          />
        </template>
        
        <!-- Comment Markers -->
        <template v-for="comment in commentStore.taskComments" :key="comment.id">
          <v-group
            v-if="annotationStore.currentImage"
            :config="{
              x: imageOffset.x + (comment.x / 100) * annotationStore.currentImage.width * imageScale,
              y: imageOffset.y + (comment.y / 100) * annotationStore.currentImage.height * imageScale,
              draggable: false
            }"
          >
            <!-- Comment Icon Circle -->
            <v-circle
              :config="{
                x: 0,
                y: 0,
                radius: 14 / annotationStore.canvasTransform.scale,
                fill: comment.resolved ? '#10B981' : '#F59E0B',
                stroke: commentStore.activeCommentId === comment.id ? '#2563EB' : '#ffffff',
                strokeWidth: commentStore.activeCommentId === comment.id ? 3 / annotationStore.canvasTransform.scale : 2 / annotationStore.canvasTransform.scale,
                shadowColor: 'black',
                shadowBlur: 6,
                shadowOpacity: 0.4,
                opacity: commentStore.activeCommentId === comment.id ? 1 : 0.9
              }"
              @click="() => handleCommentClick(comment.id)"
              @mouseenter="(e: any) => e.target.getStage().container().style.cursor = 'pointer'"
              @mouseleave="(e: any) => e.target.getStage().container().style.cursor = cursorStyle"
            />
            <!-- Message Icon (simplified) -->
            <v-text
              :config="{
                x: -6 / annotationStore.canvasTransform.scale,
                y: -7 / annotationStore.canvasTransform.scale,
                text: '💬',
                fontSize: 14 / annotationStore.canvasTransform.scale,
                fill: '#ffffff',
                listening: false
              }"
            />
          </v-group>
        </template>
      </v-layer>
      
    </v-stage>
    
    <!-- AI Processing Indicator (removed) -->
    
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
    
    <!-- Cursor Info Display (Bottom Left) -->
    <div
      v-if="infoDisplay && loadedImage"
      class="absolute bottom-4 left-4 text-gray-900 dark:text-white pointer-events-none select-none"
      style="font-family: 'Space Grotesk', monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.02em;"
    >
      {{ infoDisplay }}
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
