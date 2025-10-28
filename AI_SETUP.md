# AI-Assisted Polygon from Box - Setup Guide

## ✅ Implementation Complete!

AI-assisted polygon generation from bounding box using Hugging Face SAM is now integrated into PixlHub.

---

## 🎯 What It Does

**User draws a bounding box** → **AI generates precise polygon** → **User can edit/accept**

- Saves time on complex polygon annotations
- Uses Meta's Segment Anything Model (SAM)
- Free tier: 30 requests/minute
- High-quality segmentation

---

## 🔧 Setup Instructions

### 1. Create Hugging Face Account
1. Go to https://huggingface.co
2. Sign up (free)
3. Go to Settings → Access Tokens
4. Create a new token (read access is enough)

### 2. Add API Token to Environment
Add to your `.env` file:
```bash
HUGGINGFACE_API_TOKEN=hf_your_token_here
```

### 3. Restart Server
```bash
npm run dev
```

---

## 📁 Files Created

### Backend
- `server/config/aiConfig.ts` - AI configuration
- `server/services/aiService.ts` - AI service with SAM integration
- `server/api/ai/polygon-from-box.post.ts` - API endpoint

### Frontend
- Updated `app/stores/annotation.ts` - Added 'ai-polygon' tool
- Updated `app/components/annotation/tools/ImageAnnotationTool.vue` - AI integration
- Updated `app/components/annotation/AnnotationToolbar.vue` - AI button with sparkle icon

---

## 🎮 How to Use

### 1. Select AI Tool
Click the **sparkle icon** (✨) in the toolbar
- Purple gradient when active
- Pulsing indicator shows it's an AI tool

### 2. Draw Bounding Box
- Click and drag to draw a box around the object
- Release mouse to trigger AI

### 3. AI Generates Polygon
- Loading indicator appears
- AI processes image (1-3 seconds)
- Polygon appears automatically

### 4. Edit or Accept
- Polygon is auto-selected
- Edit points if needed (Ctrl+click to add, right-click to delete)
- Continue to next annotation

---

## 🔍 Technical Details

### API Flow
```
Frontend → /api/ai/polygon-from-box → aiService.ts → Hugging Face API → SAM Model
```

### Request Format
```typescript
{
  imageUrl: string,
  bbox: { x, y, width, height },
  imageWidth: number,
  imageHeight: number
}
```

### Response Format
```typescript
{
  success: true,
  data: {
    polygon: [{ x, y }, ...],
    confidence: 0.85,
    processingTime: 1.2
  }
}
```

### Rate Limits
- **Free tier**: 30 requests/minute
- **Upgrade**: $9/month for higher limits

---

## 🐛 Troubleshooting

### "AI service not configured"
- Check `.env` has `HUGGINGFACE_API_TOKEN`
- Restart server after adding token

### "AI service temporarily unavailable"
- Rate limit reached (30/min)
- Wait 1 minute and try again
- Or upgrade to paid tier

### "Failed to generate polygon"
- Image too large (max 1024px)
- Network issue
- Check console logs for details

---

## 💰 Cost Estimate

### Free Tier (Current Setup)
- **Cost**: $0
- **Limit**: 30 requests/minute = 1,800/hour
- **Perfect for**: MVP, demos, small teams

### Paid Tier (If Needed)
- **Cost**: $9/month
- **Limit**: Higher rate limits
- **Good for**: Production use

---

## 🚀 Future Enhancements

### Phase 2 (Not Implemented Yet)
- Auto-detect all objects in image
- Edge refinement tool
- Confidence threshold settings
- Batch processing
- Custom model fine-tuning

---

## 📝 Notes

- Polygon is created as regular annotation (can be edited)
- Works with all label types
- Respects selected label
- Integrates with undo/redo
- Exports like normal annotations

---

## 🎉 Ready to Use!

1. Add your Hugging Face token to `.env`
2. Restart the server
3. Click the sparkle icon ✨
4. Draw a box and watch the magic! 🪄

**Questions?** Check console logs for detailed debugging info.
