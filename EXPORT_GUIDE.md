# Export Annotations Guide

## Overview
PixlHub supports exporting annotations in multiple formats for different use cases.

---

## Export Formats

### 1. **JSON (Complete)** 📦
**Best for:** Backup, archiving, full data preservation

**Structure:**
```json
{
  "project": {
    "id": "proj_123",
    "name": "My Project",
    "toolType": "text",
    "annotationType": "ner"
  },
  "exportDate": "2025-10-20T14:24:00Z",
  "totalAnnotations": 150,
  "annotations": [
    {
      "assetId": "asset_123",
      "assetName": "document1.txt",
      "text": "Apple Inc. announced its latest iPhone...",
      "annotationType": "ner",
      "entities": [
        {
          "text": "Apple Inc.",
          "label": "Organization",
          "labelId": "label_org",
          "start": 0,
          "end": 10
        }
      ]
    }
  ]
}
```

**Use Cases:**
- Complete project backup
- Data migration
- Detailed analysis
- Audit trails

---

### 2. **CSV (Spreadsheet)** 📊
**Best for:** Excel, Google Sheets, data analysis

**NER Format:**
```csv
asset_name,text,entity_text,label,start,end
"document1.txt","Apple Inc. announced...","Apple Inc.","Organization",0,10
"document1.txt","Apple Inc. announced...","iPhone","Product",30,36
```

**Sentiment Format:**
```csv
asset_name,text,sentiment
"review1.txt","This product is amazing!","positive"
"review2.txt","Terrible service.","negative"
```

**Classification Format:**
```csv
asset_name,text,labels
"article1.txt","Breaking news...","Politics;Technology"
```

**Emotion Format:**
```csv
asset_name,text,emotion,intensity
"text1.txt","I'm so happy!","joy",5
```

**RLHF Format:**
```csv
asset_name,preferred,rating,feedback
"task1.json","A",5,"Response A is more professional"
```

**Use Cases:**
- Statistical analysis
- Spreadsheet processing
- Quick review
- Data visualization

---

### 3. **JSONL (ML Training)** 🤖
**Best for:** Machine learning, model training

**NER Format (SpaCy-compatible):**
```jsonl
{"text": "Apple Inc. announced its latest iPhone.", "entities": [[0, 10, "Organization"], [30, 36, "Product"]]}
{"text": "Microsoft released Windows 11.", "entities": [[0, 9, "Organization"], [18, 28, "Product"]]}
```

**Sentiment Format:**
```jsonl
{"text": "This product is amazing!", "sentiment": "positive"}
{"text": "Terrible service.", "sentiment": "negative"}
```

**Classification Format:**
```jsonl
{"text": "Breaking news about technology...", "labels": ["Politics", "Technology"]}
{"text": "New medical breakthrough...", "labels": ["Health", "Science"]}
```

**Use Cases:**
- Training NLP models
- SpaCy NER training
- Hugging Face datasets
- PyTorch/TensorFlow pipelines

---

### 4. **SpaCy Format (NER only)** 🔬
**Best for:** SpaCy NER model training

**Structure:**
```json
[
  ["Apple Inc. announced its latest iPhone.", {"entities": [[0, 10, "Organization"], [30, 36, "Product"]]}],
  ["Microsoft released Windows 11.", {"entities": [[0, 9, "Organization"], [18, 28, "Product"]]}]
]
```

**Use Cases:**
- Direct SpaCy training
- NER model fine-tuning
- Entity recognition pipelines

---

## How to Export

### Via UI:
1. Go to project page
2. Click **"Export"** button (next to Upload)
3. Select format:
   - JSON (Complete)
   - CSV (Spreadsheet)
   - JSONL (ML Training)
   - SpaCy Format (NER only)
4. File downloads automatically

### Via API:
```bash
# JSON format
GET /api/projects/{projectId}/export?format=json

# CSV format
GET /api/projects/{projectId}/export?format=csv

# JSONL format
GET /api/projects/{projectId}/export?format=jsonl

# SpaCy format
GET /api/projects/{projectId}/export?format=spacy
```

---

## Format Comparison

| Format | Size | Readability | ML-Ready | Spreadsheet | Complete Data |
|--------|------|-------------|----------|-------------|---------------|
| JSON | Large | High | No | No | ✅ Yes |
| CSV | Small | High | No | ✅ Yes | Partial |
| JSONL | Medium | Medium | ✅ Yes | No | Partial |
| SpaCy | Medium | Low | ✅ Yes (NER) | No | No |

---

## Annotation Type Support

| Format | NER | Sentiment | Classification | Emotion | RLHF |
|--------|-----|-----------|----------------|---------|------|
| JSON | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSV | ✅ | ✅ | ✅ | ✅ | ✅ |
| JSONL | ✅ | ✅ | ✅ | ✅ | ✅ |
| SpaCy | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Examples by Use Case

### Training a SpaCy NER Model
1. Export as **JSONL** or **SpaCy**
2. Use with `spacy train`
3. Format is ready for training

### Analyzing in Excel
1. Export as **CSV**
2. Open in Excel/Google Sheets
3. Create pivot tables, charts

### Backing Up Project
1. Export as **JSON**
2. Store complete data
3. Re-import if needed

### Building Custom Model
1. Export as **JSONL**
2. Parse with Python
3. Feed to PyTorch/TensorFlow

---

## Tips

### Performance
- Large projects (>10,000 annotations) may take 10-30 seconds
- Export happens in background
- File downloads automatically when ready

### File Naming
- Format: `ProjectName_YYYY-MM-DD.{format}`
- Example: `NER_Project_2025-10-20.json`

### Encoding
- All exports use UTF-8 encoding
- Special characters preserved
- Line breaks handled correctly

### Empty Projects
- Projects with no annotations return empty arrays
- Still includes project metadata
- Valid format maintained

---

## Troubleshooting

### Export Button Not Showing
- Ensure you're on the "Assets" tab
- Check you have read permissions

### Download Not Starting
- Check browser popup blocker
- Try different format
- Check network connection

### Invalid Format
- Verify annotations exist
- Check annotation type matches format
- Try JSON format (most compatible)

### Large File Issues
- Files >100MB may be slow
- Consider filtering by batch
- Use JSONL for smaller size

---

## API Response Examples

### JSON Export
```json
{
  "project": {...},
  "exportDate": "2025-10-20T14:24:00Z",
  "totalAnnotations": 150,
  "annotations": [...]
}
```

### CSV Export
```
Content-Type: text/csv
Content-Disposition: attachment; filename="project_2025-10-20.csv"

asset_name,text,entity_text,label,start,end
...
```

### JSONL Export
```
Content-Type: application/x-ndjson
Content-Disposition: attachment; filename="project_2025-10-20.jsonl"

{"text": "...", "entities": [...]}
{"text": "...", "entities": [...]}
```

---

## Integration Examples

### Python (SpaCy Training)
```python
import spacy
from spacy.training import Example

# Load JSONL export
with open('export.jsonl', 'r') as f:
    training_data = [json.loads(line) for line in f]

# Convert to SpaCy format
examples = []
for item in training_data:
    doc = nlp.make_doc(item['text'])
    example = Example.from_dict(doc, {"entities": item['entities']})
    examples.append(example)

# Train model
nlp.update(examples)
```

### Python (Pandas Analysis)
```python
import pandas as pd

# Load CSV export
df = pd.read_csv('export.csv')

# Analyze
label_counts = df['label'].value_counts()
print(label_counts)
```

### JavaScript (Processing)
```javascript
// Load JSON export
const data = await fetch('/api/projects/123/export?format=json')
  .then(r => r.json())

// Process annotations
const entities = data.annotations
  .flatMap(a => a.entities)
  .filter(e => e.label === 'Organization')

console.log(`Found ${entities.length} organizations`)
```

---

## Future Enhancements

Planned features:
- ⏳ Filtered exports (by date, label, status)
- ⏳ Scheduled exports
- ⏳ Cloud storage integration (S3, GCS)
- ⏳ Webhook notifications
- ⏳ Incremental exports

---

## Need Help?

- Check format examples above
- Verify annotation type compatibility
- Try JSON format first (most complete)
- Contact support for custom formats
