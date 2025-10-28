# RLHF Data Format Guide

## Overview
For RLHF (Reinforcement Learning from Human Feedback) projects, upload JSON or JSONL files containing prompt-response pairs.

---

## JSON Format

### Single Entry (`.json`)
```json
{
  "prompt": "Write a professional email to request a meeting with a potential client.",
  "responseA": "Subject: Meeting Request - Exploring Partnership Opportunities\n\nDear [Client Name],\n\nI hope this email finds you well. I am reaching out to explore potential partnership opportunities between our organizations.\n\nWould you be available for a brief meeting next week to discuss how we might collaborate? I am flexible with timing and happy to work around your schedule.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
  "responseB": "Subject: Quick Meeting?\n\nHey,\n\nWanted to chat about working together. Are you free sometime next week?\n\nLet me know!\n\nThanks"
}
```

### Multiple Entries (`.jsonl` - JSON Lines)
Each line is a separate JSON object:

```jsonl
{"prompt": "Explain quantum computing to a 10-year-old.", "responseA": "Quantum computers are like super-smart calculators that can solve really hard problems by thinking about many answers at the same time, kind of like having lots of brains working together!", "responseB": "Quantum computing utilizes quantum mechanical phenomena such as superposition and entanglement to perform computational operations on quantum bits or qubits."}
{"prompt": "Write a haiku about coding.", "responseA": "Lines of code flow free\nBugs hide in silent shadows\nDebug, then deploy", "responseB": "Code all day and night\nComputer screen glowing bright\nCoffee keeps me right"}
{"prompt": "Summarize the benefits of exercise.", "responseA": "Exercise improves physical health, boosts mood, increases energy, helps with weight management, and reduces risk of chronic diseases.", "responseB": "Working out is good for you because it makes you healthier and happier."}
```

---

## Field Names

The system supports both camelCase and snake_case:

### Supported Variations:
- `responseA` or `response_a`
- `responseB` or `response_b`

### Required Fields:
- ✅ `prompt` (string) - The question or instruction
- ✅ `responseA` (string) - First response option
- ✅ `responseB` (string) - Second response option

### Optional Fields:
- `metadata` (object) - Additional context
- `id` (string) - Unique identifier
- `category` (string) - Classification category

---

## Example with Metadata

```json
{
  "id": "task_001",
  "prompt": "Translate 'Hello, how are you?' to Spanish.",
  "responseA": "Hola, ¿cómo estás?",
  "responseB": "Hola, ¿qué tal?",
  "metadata": {
    "language": "spanish",
    "difficulty": "beginner",
    "category": "translation"
  }
}
```

---

## Best Practices

### 1. **Clear Prompts**
- Make prompts specific and unambiguous
- Include necessary context
- Use consistent formatting

### 2. **Diverse Responses**
- Ensure Response A and B are meaningfully different
- Vary quality, style, or approach
- Avoid identical or near-identical responses

### 3. **Balanced Difficulty**
- Mix easy and hard comparisons
- Include edge cases
- Test annotator agreement

### 4. **File Organization**
- Use `.json` for single tasks
- Use `.jsonl` for batches (recommended for large datasets)
- Keep file sizes under 50MB for optimal performance

---

## Upload Process

1. **Create Project** with tool type "RLHF"
2. **Prepare JSON/JSONL** file following format above
3. **Upload** via project page
4. **Annotate** by selecting preferred response (A or B)
5. **Rate** response quality (1-5 stars)
6. **Add feedback** (optional text explanation)

---

## Example JSONL File

Save as `rlhf_tasks.jsonl`:

```jsonl
{"prompt": "What is the capital of France?", "responseA": "The capital of France is Paris, a beautiful city known for its art, culture, and the Eiffel Tower.", "responseB": "Paris."}
{"prompt": "How do you make coffee?", "responseA": "To make coffee, grind beans, add hot water, and let it brew for 4-5 minutes before serving.", "responseB": "Put coffee in water and heat it up."}
{"prompt": "Explain photosynthesis.", "responseA": "Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen.", "responseB": "Plants use sunlight to make food."}
```

---

## Validation

The system will validate:
- ✅ Valid JSON format
- ✅ Required fields present
- ✅ Non-empty strings
- ❌ Rejects malformed JSON
- ❌ Rejects missing required fields

---

## Tips

- **Test First**: Upload a small sample (5-10 entries) to verify format
- **Consistent Style**: Use the same field names throughout your dataset
- **UTF-8 Encoding**: Ensure files are UTF-8 encoded for special characters
- **Line Breaks**: Use `\n` for line breaks within strings
- **Quotes**: Escape quotes with `\` inside strings

---

## Need Help?

If your upload fails:
1. Check JSON syntax with a validator (jsonlint.com)
2. Verify all required fields are present
3. Ensure file extension matches format (`.json` or `.jsonl`)
4. Check file size is under 512MB
