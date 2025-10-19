# Analysis: Next.js Labeler Tool → Vue/Nuxt PixlHub

## 📊 Overview

The Next.js labeler is a **fully functional, client-side annotation tool** with impressive features. Here's what we need to understand and rebuild better in Vue/Nuxt.

---

## 🏗️ Architecture Analysis

### **State Management**
- **Next.js:** Zustand (simple, lightweight)
- **PixlHub:** Pinia (more powerful, Vue-native)
- **Advantage:** Pinia has better TypeScript support and Vue devtools integration

### **Canvas Library**
- **Both use:** Konva.js (react-konva vs vue-konva)
- **Same capabilities:** Drawing, transformations, events
- **No conversion needed:** Logic translates 1:1

### **File Handling**
- **Next.js:** react-dropzone + FileReader API
- **PixlHub:** We'll use vue3-dropzone or custom dropzone
- **Storage:** Both use localStorage (we'll add backend later)

---

## 🎯 Key Features to Implement

### **1. Multi-Tool Support** ✅
- **Bounding Box** - Rectangle drawing
- **Point** - Single point annotation
- **Polygon** - Multi-point closed shape
- **Freeform** - Free drawing path
- **Select** - Move/edit existing annotations

### **2. Advanced Features** 🔥
- **Undo/Redo** - 5-state history management
- **Zoom & Pan** - Canvas transformation with Space+drag
- **Image Filters** - Brightness, contrast, saturation, invert
- **Comments System** - Internal review comments (separate from labels)
- **Keyboard Shortcuts** - Full hotkey support (1-9 for labels, tools, etc.)
- **Export Formats** - JSON, COCO, YOLO, Pascal VOC, CSV

### **3. UI Components**
- **Left Panel:** Image thumbnails, navigation
- **Top Toolbar:** Tools, zoom controls, undo/redo
- **Right Drawer:** Annotation list, label classes, settings
- **Bottom Dock:** Current image info, progress
- **Context Menu:** Right-click on annotations

---

## 📝 Core Logic Breakdown

### **Annotation Flow**

```typescript
// 1. User selects tool (bbox, polygon, etc.)
setSelectedTool('bbox')

// 2. User clicks on canvas
handleMouseDown(e) {
  const pos = getTransformedPointerPosition(stage)
  if (tool === 'bbox') {
    startDrawingRect(pos)
  }
}

// 3. User drags to create shape
handleMouseMove(e) {
  if (isDrawing) {
    updateCurrentRect(pos)
  }
}

// 4. User releases to complete
handleMouseUp(e) {
  if (currentRect.width > 5 && currentRect.height > 5) {
    addAnnotation({
      id: generateId(),
      type: 'bbox',
      labelId: selectedLabelId,
      bbox: currentRect,
      visible: true,
      createdAt: Date.now()
    })
  }
}
```

### **Coordinate System**

**CRITICAL:** The tool uses two coordinate systems:

1. **Canvas Coordinates** - Where annotations are drawn (scaled to fit screen)
2. **Image Coordinates** - Original image pixel coordinates (for export)

```typescript
// When drawing: Use canvas coordinates
annotation.bbox = { x: 100, y: 50, width: 200, height: 150 }

// When exporting: Convert to image coordinates
const scale = imageSize.width / canvasSize.width
exportedBbox = {
  x: annotation.bbox.x * scale,
  y: annotation.bbox.y * scale,
  width: annotation.bbox.width * scale,
  height: annotation.bbox.height * scale
}
```

### **History Management**

```typescript
// Save state before each change
saveToHistory() {
  const snapshot = {
    images: deepClone(state.images),
    currentImageIndex: state.currentImageIndex,
    timestamp: Date.now()
  }
  history.push(snapshot)
  // Keep only last 5 states
  if (history.length > 5) history.shift()
}

// Undo: Go back one state
undo() {
  if (historyIndex > 0) {
    historyIndex--
    restoreState(history[historyIndex])
  }
}
```

---

## 🔧 Technical Implementation Plan

### **Phase 1: Core Annotation Engine** (Priority 1)

#### **1.1 File Upload & Image Loading**
```vue
<!-- FileUpload.vue -->
<template>
  <div
    @drop.prevent="handleDrop"
    @dragover.prevent
    class="dropzone"
  >
    <input
      type="file"
      multiple
      accept="image/*"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
const annotationStore = useAnnotationStore()

const handleFileSelect = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  
  for (const file of Array.from(files)) {
    const url = await readFileAsDataURL(file)
    const img = await loadImage(url)
    
    annotationStore.addImage({
      id: generateId(),
      name: file.name,
      url,
      width: img.width,
      height: img.height,
      annotations: []
    })
  }
}
</script>
```

#### **1.2 Canvas Drawing System**
```vue
<!-- AnnotationCanvas.vue -->
<template>
  <div ref="containerRef" class="canvas-container">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
    >
      <v-layer>
        <!-- Main Image -->
        <v-image
          :config="{
            image: loadedImage,
            x: 0,
            y: 0,
            width: imageSize.width,
            height: imageSize.height
          }"
        />
        
        <!-- Existing Annotations -->
        <template v-for="ann in currentAnnotations" :key="ann.id">
          <v-rect
            v-if="ann.type === 'bbox'"
            :config="{
              x: ann.bbox.x,
              y: ann.bbox.y,
              width: ann.bbox.width,
              height: ann.bbox.height,
              stroke: getLabelColor(ann.labelId),
              strokeWidth: 2,
              draggable: selectedTool === 'select'
            }"
            @click="selectAnnotation(ann.id)"
          />
        </template>
        
        <!-- Drawing Preview -->
        <v-rect
          v-if="currentRect"
          :config="{
            x: currentRect.x,
            y: currentRect.y,
            width: currentRect.width,
            height: currentRect.height,
            stroke: '#2563EB',
            strokeWidth: 2,
            dash: [5, 5]
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>
```

#### **1.3 Tool System**
```typescript
// tools.ts
export const tools = {
  bbox: {
    name: 'Bounding Box',
    icon: 'Square',
    hotkey: 'B',
    cursor: 'crosshair',
    onMouseDown: (pos) => startDrawingRect(pos),
    onMouseMove: (pos) => updateRect(pos),
    onMouseUp: (pos) => completeRect(pos)
  },
  polygon: {
    name: 'Polygon',
    icon: 'Pentagon',
    hotkey: 'P',
    cursor: 'crosshair',
    onMouseDown: (pos) => addPolygonPoint(pos),
    onComplete: () => closePolygon()
  },
  point: {
    name: 'Point',
    icon: 'Dot',
    hotkey: 'O',
    cursor: 'crosshair',
    onMouseDown: (pos) => createPoint(pos)
  },
  select: {
    name: 'Select',
    icon: 'MousePointer',
    hotkey: 'V',
    cursor: 'default',
    onMouseDown: (ann) => selectAnnotation(ann)
  }
}
```

---

### **Phase 2: UI Components** (Priority 2)

#### **2.1 Toolbar**
```vue
<template>
  <div class="toolbar">
    <!-- Tools -->
    <div class="tool-group">
      <button
        v-for="tool in tools"
        :key="tool.name"
        :class="{ active: selectedTool === tool.name }"
        @click="setTool(tool.name)"
      >
        <component :is="tool.icon" />
        <span>{{ tool.hotkey }}</span>
      </button>
    </div>
    
    <!-- Zoom Controls -->
    <div class="tool-group">
      <button @click="zoomIn">
        <ZoomIn />
      </button>
      <span>{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoomOut">
        <ZoomOut />
      </button>
      <button @click="fitToScreen">
        <Maximize />
      </button>
    </div>
    
    <!-- History -->
    <div class="tool-group">
      <button @click="undo" :disabled="!canUndo">
        <Undo />
      </button>
      <button @click="redo" :disabled="!canRedo">
        <Redo />
      </button>
    </div>
  </div>
</template>
```

#### **2.2 Label Selector**
```vue
<template>
  <div class="label-selector">
    <div
      v-for="label in labels"
      :key="label.id"
      :class="{ active: selectedLabelId === label.id }"
      @click="selectLabel(label.id)"
    >
      <div
        class="color-indicator"
        :style="{ backgroundColor: label.color }"
      />
      <span>{{ label.name }}</span>
      <kbd>{{ label.shortcut }}</kbd>
    </div>
  </div>
</template>
```

#### **2.3 Annotation List**
```vue
<template>
  <div class="annotation-list">
    <div
      v-for="ann in annotations"
      :key="ann.id"
      :class="{ selected: selectedAnnotationId === ann.id }"
      @click="selectAnnotation(ann.id)"
    >
      <div class="ann-header">
        <span>{{ getLabelName(ann.labelId) }}</span>
        <button @click="toggleVisibility(ann.id)">
          <Eye v-if="ann.visible" />
          <EyeOff v-else />
        </button>
        <button @click="deleteAnnotation(ann.id)">
          <Trash />
        </button>
      </div>
      <div class="ann-info">
        {{ getAnnotationInfo(ann) }}
      </div>
    </div>
  </div>
</template>
```

---

### **Phase 3: Export System** (Priority 3)

#### **3.1 Export Formats**
```typescript
// exportFormats.ts
export const exporters = {
  json: (images: AnnotatedImage[]) => {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      images: images.map(img => ({
        name: img.name,
        width: img.width,
        height: img.height,
        annotations: img.annotations
      }))
    }
  },
  
  coco: (images: AnnotatedImage[], labels: LabelClass[]) => {
    return {
      info: {
        description: 'PixlHub Export',
        version: '1.0',
        date_created: new Date().toISOString()
      },
      images: images.map((img, idx) => ({
        id: idx + 1,
        file_name: img.name,
        width: img.width,
        height: img.height
      })),
      annotations: images.flatMap((img, imgIdx) =>
        img.annotations.map((ann, annIdx) => ({
          id: annIdx + 1,
          image_id: imgIdx + 1,
          category_id: labels.findIndex(l => l.id === ann.labelId) + 1,
          bbox: ann.bbox ? [
            ann.bbox.x,
            ann.bbox.y,
            ann.bbox.width,
            ann.bbox.height
          ] : undefined,
          area: ann.bbox ? ann.bbox.width * ann.bbox.height : 0,
          iscrowd: 0
        }))
      ),
      categories: labels.map((label, idx) => ({
        id: idx + 1,
        name: label.name,
        supercategory: 'object'
      }))
    }
  },
  
  yolo: (images: AnnotatedImage[], labels: LabelClass[]) => {
    // YOLO format: class_id center_x center_y width height (normalized 0-1)
    return images.map(img => {
      const lines = img.annotations.map(ann => {
        if (!ann.bbox) return null
        const classId = labels.findIndex(l => l.id === ann.labelId)
        const centerX = (ann.bbox.x + ann.bbox.width / 2) / img.width
        const centerY = (ann.bbox.y + ann.bbox.height / 2) / img.height
        const width = ann.bbox.width / img.width
        const height = ann.bbox.height / img.height
        return `${classId} ${centerX} ${centerY} ${width} ${height}`
      }).filter(Boolean)
      
      return {
        filename: img.name.replace(/\.[^/.]+$/, '.txt'),
        content: lines.join('\n')
      }
    })
  }
}
```

---

## 🎨 What We'll Build Better

### **Improvements Over Next.js Version**

1. **Backend Integration** 🔥
   - Real database (PostgreSQL) instead of localStorage
   - Multi-user support with authentication
   - Project management system
   - Task assignment and review workflow

2. **Better UX** ✨
   - Smoother animations with Vue transitions
   - Better keyboard shortcut system
   - More intuitive tool switching
   - Real-time collaboration (future)

3. **Performance** ⚡
   - Virtual scrolling for large image lists
   - Web Workers for export processing
   - Optimized canvas rendering
   - Lazy loading images

4. **Enterprise Features** 💼
   - Role-based access control
   - Audit logs
   - Batch operations
   - API for external integrations
   - Quality metrics and analytics

---

## 📋 Implementation Checklist

### **Week 1: Core Engine**
- [ ] File upload with drag & drop
- [ ] Image loading and display
- [ ] Bounding box tool
- [ ] Point tool
- [ ] Label selection
- [ ] Basic zoom & pan
- [ ] localStorage persistence

### **Week 2: Advanced Tools**
- [ ] Polygon tool
- [ ] Freeform tool
- [ ] Select tool (move/edit)
- [ ] Undo/Redo system
- [ ] Keyboard shortcuts
- [ ] Annotation list UI

### **Week 3: Export & Polish**
- [ ] JSON export
- [ ] COCO export
- [ ] YOLO export
- [ ] Import annotations
- [ ] Image filters
- [ ] Settings panel

### **Week 4: Backend Integration**
- [ ] Prisma schema
- [ ] API endpoints
- [ ] Authentication
- [ ] Project management
- [ ] Task assignment

---

## 🚀 Next Steps

**Immediate Action:**
1. Start with **File Upload** component
2. Build **Canvas System** with bounding box tool
3. Implement **localStorage** persistence
4. Add **basic toolbar** and label selector

**This gives us a working MVP in ~2-3 days!**

Then we can progressively add:
- More tools (polygon, point)
- Export formats
- Backend integration
- Advanced features

---

## 💡 Key Takeaways

1. **The Next.js tool is excellent** - Well-architected, feature-complete
2. **Direct translation is possible** - Konva works the same in Vue
3. **We can do better** - Add backend, multi-user, better UX
4. **Start simple** - MVP first, then iterate
5. **Focus on core value** - Annotation quality > fancy features

**Let's build this! 🎯**
