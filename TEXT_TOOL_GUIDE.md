# Text Annotation Tool - Complete Guide

## ✅ Features Implemented

### **3 Annotation Modes:**

#### 1. **NER (Named Entity Recognition)** 🏷️
- Select text spans to annotate entities
- Highlight entities with label colors
- No overlapping spans allowed
- Click to select/deselect spans
- Delete key to remove selected span
- Shows entity list with label names

#### 2. **Sentiment Analysis** 😊
- Rate text sentiment: Positive, Neutral, Negative
- Visual emoji indicators
- Single selection (toggle on/off)
- Clean, simple interface

#### 3. **Text Classification** 📋
- Multi-label classification
- Select multiple categories
- Checkbox-style selection
- Uses project labels

---

## 🎮 How to Use

### **Switch Between Modes:**
- Click mode buttons at the top
- Or use keyboard shortcuts: `1` (NER), `2` (Sentiment), `3` (Classification)

### **NER Mode:**
1. Select a label from the sidebar
2. Highlight text with your mouse
3. Release to create entity span
4. Click span to select it
5. Press `Delete` or `Backspace` to remove

### **Sentiment Mode:**
1. Read the text
2. Click sentiment button (Positive/Neutral/Negative)
3. Click again to deselect

### **Classification Mode:**
1. Read the text
2. Click categories to select (multi-select)
3. Click again to deselect

---

## 🔧 Technical Details

### **Text Span Structure:**
```typescript
interface TextSpan {
  id: string
  start: number      // Character position
  end: number        // Character position
  text: string       // Selected text
  labelId: string    // Label ID
  color: string      // Label color
}
```

### **Features:**
- ✅ Real-time text highlighting
- ✅ Overlap detection
- ✅ Keyboard shortcuts
- ✅ Label color coding
- ✅ Entity list view
- ✅ Delete functionality
- ✅ Selection state management
- ✅ Dark mode support

---

## 🎯 Testing

### **Test NER:**
1. Go to `/annotate`
2. Ensure `toolType: 'text'` in `annotate.vue`
3. Select a label (Person, Vehicle, etc.)
4. Highlight "Apple Inc." → Creates entity span
5. Highlight "Tim Cook" → Creates another span
6. Click span → Selects it (blue ring)
7. Press Delete → Removes span

### **Test Sentiment:**
1. Switch to Sentiment mode (button or press `2`)
2. Click "Positive" → Selected
3. Click "Positive" again → Deselected

### **Test Classification:**
1. Switch to Classification mode (button or press `3`)
2. Click multiple labels → All selected
3. Click again → Deselected

---

## 🔄 Switch Back to Image Tool

In `annotate.vue`, change:
```typescript
toolType: 'image'  // Back to image annotation
```

---

## 📊 Sample Text

The tool includes a realistic sample text about Apple's iPhone announcement, perfect for testing:
- **Entities:** Apple Inc., Cupertino, California, Tim Cook, China, India
- **Sentiment:** Positive (stock price rose, strong sales predicted)
- **Categories:** Technology, Business, Product Launch

---

## 🚀 Next Steps

### **Potential Enhancements:**
- [ ] Save annotations to backend
- [ ] Load text from API/file upload
- [ ] Export annotations (JSON, CSV)
- [ ] Undo/Redo for text spans
- [ ] Span editing (change label)
- [ ] Relation annotations (entity relationships)
- [ ] Multi-document support
- [ ] Annotation statistics

### **Integration:**
- Connect to annotation store for persistence
- Add task navigation (next/previous text)
- Implement review workflow
- Add annotation export

---

## 💡 Architecture Benefits

✅ **Modular:** Each tool is independent
✅ **Reusable:** Sidebar and toolbar work across tools
✅ **Scalable:** Easy to add more modes
✅ **Type-safe:** Full TypeScript support
✅ **Consistent:** Same design language as image tool

---

**The Text Annotation Tool is now fully functional!** 🎉

Test it by navigating to `/annotate` with `toolType: 'text'`.
