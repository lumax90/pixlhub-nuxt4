# Label Schema System Analysis

## Overview
Based on the labeling-hub-main reference project, their label schema system is well-designed for enterprise use with the following key features:

---

## Core Schema Structure

### 1. **LabelSchema (Project-Level)**
```prisma
model LabelSchema {
  id        String       @id @default(cuid())
  projectId String       @unique        // One schema per project
  project   Project      @relation(...)
  classes   LabelClass[]               // Multiple label classes
  version   Int          @default(1)   // Schema versioning
  createdAt DateTime
  updatedAt DateTime
}
```

**Key Points:**
- One label schema per project
- Versioning support for schema evolution
- Centralized management

---

### 2. **LabelClass (Individual Labels)**
```prisma
model LabelClass {
  id            String       @id @default(cuid())
  labelSchemaId String
  labelSchema   LabelSchema  @relation(...)
  name          String       // Display name (e.g., "Car", "Person")
  color         String       // Hex color for visualization
  shortcut      String?      // Keyboard shortcut (1-9)
  description   String?      // Optional description
  order         Int          @default(0)  // Display order
  annotations   Annotation[] // All annotations using this class
  createdAt     DateTime
  updatedAt     DateTime
}
```

**Key Points:**
- Each label has unique ID, name, color
- Keyboard shortcuts for fast labeling
- Order field for consistent display
- Description for guidelines
- Direct relation to annotations (referential integrity)

---

### 3. **Annotation Structure**
```prisma
model Annotation {
  id           String      @id
  taskId       String
  task         Task        @relation(...)
  labelClassId String      // Links to LabelClass
  labelClass   LabelClass  @relation(...)
  type         String      // "bbox", "polygon", "point", "line"
  data         Json        // Coordinates and shape data
  confidence   Float?      // For ML-assisted annotations
  metadata     Json?       // Additional properties
  createdAt    DateTime
  updatedAt    DateTime
}
```

**Key Points:**
- Annotations reference LabelClass (not just ID)
- Type field supports multiple annotation types
- Flexible JSON data for different shapes
- Confidence score for AI-assisted labeling
- Metadata for extensibility

---

## Frontend Implementation

### Label Class Interface
```typescript
interface LabelClass {
  id: string;
  name: string;
  color: string;
  shortcut: number;  // 1-9 for keyboard shortcuts
}
```

### Annotation Types Support
```typescript
type AnnotationType = 'bbox' | 'point' | 'polygon' | 'freeform';

interface Annotation {
  id: string;
  type: AnnotationType;
  labelId: string;
  bbox?: BoundingBox;
  point?: Point;
  polygon?: Polygon;
  freeform?: FreeformPath;
  visible: boolean;
  createdAt: number;
}
```

---

## UI/UX Features

### Edit Labels Modal
1. **List View**
   - Shows all label classes in order
   - Each row: Name input, Shortcut input, Color picker, Delete button
   - Order indicator (1, 2, 3...)

2. **Add New Label**
   - Auto-generates random color
   - Auto-assigns next available shortcut
   - Default name pattern: "Label N"

3. **Warning System**
   - Shows warning when changing labels
   - Explains that existing annotations will be affected
   - Requires explicit confirmation

4. **Validation**
   - Unique names
   - Valid shortcuts (1-9)
   - Valid hex colors

---

## Business Logic

### Label Service Operations
1. **createOrUpdateSchema** - Replaces entire schema (atomic operation)
2. **getSchema** - Fetches schema with classes ordered
3. **addClass** - Adds single class with auto-order
4. **updateClass** - Updates specific class properties
5. **deleteClass** - Removes class (cascade to annotations)

### Key Behaviors
- **Order Management**: Auto-increments order when adding
- **Cascade Delete**: Deleting a label class affects annotations
- **Schema Versioning**: Tracks schema changes over time
- **Atomic Updates**: Full schema replacement prevents inconsistency

---

## What We Need to Implement for PixlHub

### Phase 1: Label Schema Tab (Immediate)
1. ✅ **Label Class CRUD**
   - Create new label classes
   - Edit existing (name, color, shortcut, description)
   - Delete with warning
   - Reorder labels

2. ✅ **UI Components**
   - Label list with inline editing
   - Color picker integration
   - Shortcut assignment (1-9)
   - Add/Remove buttons
   - Save/Cancel actions

3. ✅ **Validation**
   - Unique label names
   - Valid shortcuts (no duplicates)
   - Color format validation
   - Required fields check

4. ✅ **Warning System**
   - Warn on schema changes
   - Explain impact on annotations
   - Confirmation dialog

### Phase 2: Advanced Features (Future)
1. **Label Hierarchies** (Optional)
   - Parent-child relationships
   - Categories and subcategories
   - Example: Vehicle → Car, Truck, Bus

2. **Label Attributes** (Optional)
   - Additional properties per label
   - Example: Color, Size, Condition
   - Dropdown/checkbox attributes

3. **Label Templates** (Optional)
   - Pre-defined label sets
   - Industry-specific templates
   - Import/export label schemas

4. **Schema Versioning** (Future)
   - Track schema changes
   - Rollback capability
   - Migration tools

---

## Data Structure for PixlHub

### TypeScript Types
```typescript
interface LabelSchema {
  id: string;
  projectId: string;
  classes: LabelClass[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LabelClass {
  id: string;
  labelSchemaId: string;
  name: string;
  color: string;
  shortcut?: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Annotation {
  id: string;
  taskId: string;
  labelClassId: string;
  type: 'bbox' | 'polygon' | 'point' | 'line' | 'segmentation';
  data: {
    // For bbox
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    // For polygon/line
    points?: Array<{ x: number; y: number }>;
    // For segmentation
    mask?: string; // Base64 or URL
  };
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Implementation Strategy

### Step 1: Update Types (5 min)
- Add LabelSchema and LabelClass types
- Update Project type to include labelSchema

### Step 2: Create Label Schema Store (10 min)
- Pinia store for label management
- CRUD operations
- Validation logic

### Step 3: Build Label Schema Tab UI (30 min)
- Label list component
- Add/Edit/Delete functionality
- Color picker integration
- Shortcut assignment

### Step 4: Connect to Project (10 min)
- Load labels when opening project
- Save labels to project
- Warning dialogs

### Step 5: Integration with Annotation Tool (15 min)
- Load labels into sidebar
- Apply labels to annotations
- Keyboard shortcuts

---

## Summary

The reference project has a **robust, enterprise-ready label schema system** with:
- ✅ Proper database relations
- ✅ Versioning support
- ✅ Flexible annotation types
- ✅ User-friendly UI
- ✅ Warning systems
- ✅ Keyboard shortcuts
- ✅ Order management

We will implement a **similar system** adapted to PixlHub's architecture, starting with the core features and leaving room for future enhancements like hierarchies and attributes.
