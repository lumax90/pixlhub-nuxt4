# PixlHub Annotation Tools - Status Audit

**Date:** October 20, 2025  
**Status:** Comprehensive review of all annotation tools

---

## 🎯 Current Status Overview

| Tool | Status | Upload Support | Data Flow | API Integration | Priority |
|------|--------|----------------|-----------|-----------------|----------|
| **Image Tool** | ✅ **COMPLETE** | Images (JPG, PNG, etc.) | Full | Complete | - |
| **Text Tool** | ⚠️ **PARTIAL** | ❌ Images only | Mock data | Missing | 🔴 HIGH |
| **RLHF Tool** | ⚠️ **PARTIAL** | ❌ Images only | Mock data | Missing | 🔴 HIGH |
| **Audio Tool** | ❌ **INCOMPLETE** | ❌ Images only | Mock data | Missing | 🟡 MEDIUM |
| **Video Tool** | ❌ **INCOMPLETE** | ❌ Images only | Mock data | Missing | 🟡 MEDIUM |
| **Document Tool** | ❌ **INCOMPLETE** | ❌ Images only | Mock data | Missing | 🟡 MEDIUM |
| **Classification Tool** | ⚠️ **PARTIAL** | ❌ Images only | Mock data | Missing | 🟡 MEDIUM |
| **Emotion Tool** | ⚠️ **PARTIAL** | ❌ Images only | Mock data | Missing | 🟢 LOW |

---

## 🔴 Critical Issues

### 1. **Upload System - Wrong File Types**
**Problem:** All projects use the same image upload system regardless of annotation type.

**Current Behavior:**
- Text project → Uploads images ❌
- Audio project → Uploads images ❌
- Video project → Uploads images ❌
- RLHF project → Uploads images ❌

**What's Needed:**
- Text projects → Upload `.txt`, `.csv`, `.json` files
- Audio projects → Upload `.mp3`, `.wav`, `.ogg`, `.m4a` files
- Video projects → Upload `.mp4`, `.mov`, `.avi`, `.webm` files
- Document projects → Upload `.pdf`, `.docx`, `.txt` files
- RLHF projects → Upload `.json`, `.jsonl` (prompt-response pairs)

---

### 2. **Mock Data Everywhere**
**Problem:** All non-image tools use hardcoded sample data.

**Current State:**
```javascript
// TextAnnotationTool.vue - Line 44
const sampleText = ref(`Apple Inc. announced its latest iPhone...`)

// RLHFTool.vue - Line 19
const currentTask = ref({
  id: 'task_1',
  prompt: 'Write a professional email...',
  responseA: { ... },
  responseB: { ... }
})
```

**What's Needed:**
- Load actual data from uploaded files
- Fetch from `/api/tasks/[id]` endpoint
- Display real asset content

---

### 3. **No Asset Type Handling**
**Problem:** Upload API only processes images.

**Current Code:**
```typescript
// upload.post.ts - Line 86
const contentType = item.type || 'image/jpeg'
const imageBuffer = Buffer.from(item.data)

// Get image dimensions ← Only works for images!
const dimensions = await getImageDimensions(imageBuffer)
```

**What's Needed:**
- Detect file type from extension/MIME
- Process different file types appropriately
- Store type-specific metadata

---

## 📋 Detailed Tool Analysis

### ✅ **Image Annotation Tool** (COMPLETE)
**Status:** Fully functional
- ✅ Konva canvas integration
- ✅ Bounding box, polygon, point tools
- ✅ Real-time annotation
- ✅ Save/load from API
- ✅ Undo/redo
- ✅ Keyboard shortcuts
- ✅ Task queue integration

---

### ⚠️ **Text Annotation Tool** (NEEDS WORK)
**Current Features:**
- ✅ NER (Named Entity Recognition) mode
- ✅ Sentiment analysis mode
- ✅ Classification mode
- ✅ Text span selection
- ✅ UI/UX complete

**Missing:**
- ❌ Load text from uploaded files
- ❌ API integration for saving annotations
- ❌ Support for `.txt`, `.csv`, `.json` uploads
- ❌ Batch text processing
- ❌ Export text annotations

**What to Build:**
1. Text file upload handler
2. API endpoint: `GET /api/tasks/[id]/text-content`
3. Save text annotations to database
4. Export format for NER/sentiment data

---

### ⚠️ **RLHF Tool** (NEEDS WORK)
**Current Features:**
- ✅ Response comparison UI
- ✅ Preference selection (A vs B)
- ✅ Rating system (1-5 stars)
- ✅ Feedback text input
- ✅ Keyboard shortcuts

**Missing:**
- ❌ Load prompt-response pairs from files
- ❌ API integration for saving rankings
- ❌ Support for `.json`/`.jsonl` uploads
- ❌ Multi-turn conversation support
- ❌ Export RLHF dataset

**What to Build:**
1. JSON/JSONL file upload handler
2. API endpoint: `GET /api/tasks/[id]/rlhf-data`
3. Save rankings to database
4. Export format for RLHF training data

---

### ❌ **Audio Annotation Tool** (INCOMPLETE)
**Current Features:**
- Basic UI skeleton only

**Missing:**
- ❌ Audio player integration
- ❌ Waveform visualization
- ❌ Timestamp-based annotations
- ❌ Audio file upload support
- ❌ Transcription display
- ❌ Speaker diarization labels

**What to Build:**
1. Audio file upload handler (`.mp3`, `.wav`, etc.)
2. Waveform library integration (e.g., WaveSurfer.js)
3. Timestamp annotation system
4. Audio playback controls
5. Export audio annotations with timestamps

---

### ❌ **Video Annotation Tool** (INCOMPLETE)
**Current Features:**
- Basic UI skeleton only

**Missing:**
- ❌ Video player integration
- ❌ Frame-by-frame annotation
- ❌ Temporal bounding boxes
- ❌ Video file upload support
- ❌ Timeline scrubbing
- ❌ Action recognition labels

**What to Build:**
1. Video file upload handler (`.mp4`, `.mov`, etc.)
2. Video player with frame control
3. Temporal annotation system
4. Object tracking across frames
5. Export video annotations with timestamps

---

### ❌ **Document Annotation Tool** (INCOMPLETE)
**Current Features:**
- Basic UI skeleton only

**Missing:**
- ❌ PDF viewer integration
- ❌ Document text extraction
- ❌ Layout analysis
- ❌ PDF/DOCX upload support
- ❌ OCR integration
- ❌ Form field extraction

**What to Build:**
1. PDF/DOCX file upload handler
2. PDF.js integration for viewing
3. Text extraction and OCR
4. Layout annotation system
5. Export document annotations

---

## 🚀 Implementation Priority

### **Phase 1: Text Tool (HIGH PRIORITY)** 🔴
**Why:** Most commonly used after images, easiest to implement

**Tasks:**
1. ✅ Create text file upload handler
2. ✅ Add text content API endpoint
3. ✅ Connect TextAnnotationTool to real data
4. ✅ Implement save annotations API
5. ✅ Add export functionality

**Estimated Time:** 2-3 days

---

### **Phase 2: RLHF Tool (HIGH PRIORITY)** 🔴
**Why:** Critical for AI training workflows

**Tasks:**
1. ✅ Create JSON/JSONL upload handler
2. ✅ Add RLHF data API endpoint
3. ✅ Connect RLHFTool to real data
4. ✅ Implement ranking save API
5. ✅ Add export functionality

**Estimated Time:** 2-3 days

---

### **Phase 3: Audio Tool (MEDIUM PRIORITY)** 🟡
**Why:** Specialized use case, requires audio libraries

**Tasks:**
1. ✅ Audio file upload handler
2. ✅ Integrate WaveSurfer.js
3. ✅ Build timestamp annotation system
4. ✅ Implement save/export

**Estimated Time:** 4-5 days

---

### **Phase 4: Video Tool (MEDIUM PRIORITY)** 🟡
**Why:** Complex, requires video processing

**Tasks:**
1. ✅ Video file upload handler
2. ✅ Integrate video player
3. ✅ Build temporal annotation system
4. ✅ Implement save/export

**Estimated Time:** 5-7 days

---

### **Phase 5: Document Tool (LOW PRIORITY)** 🟢
**Why:** Specialized, may need OCR services

**Tasks:**
1. ✅ PDF/DOCX upload handler
2. ✅ Integrate PDF.js
3. ✅ Build document annotation system
4. ✅ Implement save/export

**Estimated Time:** 4-5 days

---

## 🛠️ Technical Requirements

### **Upload System Refactor**
```typescript
// Need to add file type detection
function detectAssetType(filename: string, mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'document'
  if (filename.endsWith('.txt')) return 'text'
  if (filename.endsWith('.json') || filename.endsWith('.jsonl')) return 'rlhf'
  return 'unknown'
}
```

### **Asset Model Update**
```prisma
model Asset {
  // ... existing fields
  type        String   // 'image', 'text', 'audio', 'video', 'document', 'rlhf'
  content     String?  // For text/RLHF, store content directly
  metadata    Json?    // Type-specific metadata
}
```

### **API Endpoints Needed**
- `GET /api/tasks/[id]/content` - Get asset content by type
- `POST /api/annotations/text` - Save text annotations
- `POST /api/annotations/rlhf` - Save RLHF rankings
- `POST /api/annotations/audio` - Save audio annotations
- `POST /api/annotations/video` - Save video annotations

---

## 📊 Summary

**Total Tools:** 8  
**Complete:** 1 (Image)  
**Partial:** 4 (Text, RLHF, Classification, Emotion)  
**Incomplete:** 3 (Audio, Video, Document)  

**Immediate Action Required:**
1. 🔴 Fix upload system to accept correct file types per project
2. 🔴 Implement Text Tool data flow
3. 🔴 Implement RLHF Tool data flow
4. 🟡 Build Audio/Video tools when needed

**Recommendation:** Focus on Text and RLHF tools first as they're most commonly used and easiest to implement.
