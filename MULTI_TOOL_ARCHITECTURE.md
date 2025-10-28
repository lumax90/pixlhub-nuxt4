# PixlHub Multi-Tool Architecture

## ✅ Refactoring Complete

### What Changed:
1. **Added `ToolType` to Project interface** - Determines which annotation tool to load
2. **Created `AnnotationWorkspace.vue`** - Dynamic component loader based on tool type
3. **Moved `AnnotationCanvas.vue` → `tools/ImageAnnotationTool.vue`** - Organized as a tool
4. **Created placeholder tools** - Text, Classification, RLHF, Emotion, Video, Audio, Document
5. **Updated `annotate.vue`** - Now uses `AnnotationWorkspace` with project prop

### File Structure:
```
app/components/annotation/
├── AnnotationWorkspace.vue          ← NEW: Dynamic tool loader
├── tools/
│   ├── ImageAnnotationTool.vue      ← MOVED: Was AnnotationCanvas.vue
│   ├── TextAnnotationTool.vue       ← NEW: Text annotation (NER, sentiment)
│   ├── ClassificationTool.vue       ← NEW: Single/multi-label classification
│   ├── RLHFTool.vue                 ← NEW: RLHF ranking
│   ├── EmotionTool.vue              ← NEW: Emotion tagging
│   ├── VideoAnnotationTool.vue      ← NEW: Video annotation
│   ├── AudioAnnotationTool.vue      ← NEW: Audio annotation
│   └── DocumentAnnotationTool.vue   ← NEW: Document annotation
├── AnnotationSidebar.vue
├── AnnotationToolbar.vue
└── AnnotationContextMenu.vue
```

### How It Works:

#### 1. Project Configuration
```typescript
const project = {
  toolType: 'image',  // ← Change this to switch tools
  // 'text' | 'classification' | 'rlhf' | 'emotion' | 'video' | 'audio' | 'document'
}
```

#### 2. Dynamic Tool Loading
```vue
<!-- AnnotationWorkspace.vue -->
<component :is="currentToolComponent" />
```

The workspace automatically loads the correct tool based on `project.toolType`.

#### 3. Tool Types Available:
- **image** - Bounding box, polygon, segmentation, keypoint (CURRENT)
- **text** - NER, sentiment analysis, text classification
- **classification** - Single/multi-label classification
- **rlhf** - RLHF ranking and preference selection
- **emotion** - Emotion tagging with intensity
- **video** - Frame-by-frame and temporal annotation
- **audio** - Transcription and speaker diarization
- **document** - OCR and layout detection

### Testing:

#### Test Image Tool (Default):
```typescript
// In annotate.vue
currentProject.value.toolType = 'image'
```
✅ Should show the full image annotation interface (bbox, polygon, etc.)

#### Test Text Tool:
```typescript
currentProject.value.toolType = 'text'
```
✅ Should show the text annotation placeholder

#### Test Other Tools:
Change `toolType` to any of: `classification`, `rlhf`, `emotion`, `video`, `audio`, `document`

### Next Steps:

#### Phase 1: Text Annotation Tool (Recommended Next)
- [ ] Text span selection for NER
- [ ] Sentiment analysis interface
- [ ] Text classification mode
- [ ] Entity highlighting and labeling

#### Phase 2: Classification Tool
- [ ] Radio buttons for single-label
- [ ] Checkboxes for multi-label
- [ ] Image preview support
- [ ] Text content support

#### Phase 3: RLHF Tool
- [ ] Side-by-side comparison view
- [ ] Ranking interface (drag-and-drop)
- [ ] Preference selection (A vs B)
- [ ] Rating scales

### API Integration:

When loading a project from the API, include `toolType`:

```typescript
// server/api/projects/[id].get.ts
return {
  id: 'proj_123',
  toolType: 'image',  // ← From database
  // ... other fields
}
```

### Benefits:
✅ **Scalable** - Easy to add new tools
✅ **Modular** - Each tool is independent
✅ **Type-safe** - TypeScript ensures correct tool types
✅ **Maintainable** - Clear separation of concerns
✅ **Flexible** - Can support any annotation workflow

---

## 🎯 Current Status:
- ✅ Architecture refactored
- ✅ Image tool working (all features intact)
- ✅ Placeholder tools created
- ⏳ Ready to build Text Annotation Tool next
