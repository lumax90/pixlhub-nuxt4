import type { LabelSchema, ToolType } from '~/types'

// In-memory storage for label schemas
// TODO: Replace with actual database (Prisma, Supabase, etc.)
const labelSchemas = new Map<string, LabelSchema>()

// Default schema for image projects (empty - user will add their own labels)
const getDefaultImageSchema = (projectId: string): LabelSchema => ({
  id: `schema_${projectId}`,
  projectId,
  toolType: 'image',
  version: 1,
  classes: [],
  createdAt: new Date(),
  updatedAt: new Date()
})

// Default schema for text projects (empty - user will add their own entity types)
const getDefaultTextSchema = (projectId: string): LabelSchema => ({
  id: `schema_${projectId}`,
  projectId,
  toolType: 'text',
  version: 1,
  classes: [],
  createdAt: new Date(),
  updatedAt: new Date()
})

// Default schema for sentiment analysis (predefined labels)
const getDefaultSentimentSchema = (projectId: string): LabelSchema => ({
  id: `schema_${projectId}`,
  projectId,
  toolType: 'sentiment',
  version: 1,
  classes: [
    {
      id: 'label_1',
      labelSchemaId: `schema_${projectId}`,
      name: 'Positive',
      color: '#10B981',
      shortcut: '1',
      description: 'Positive sentiment',
      order: 0,
      attributes: [],
      annotationTypes: ['sentiment'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'label_2',
      labelSchemaId: `schema_${projectId}`,
      name: 'Negative',
      color: '#EF4444',
      shortcut: '2',
      description: 'Negative sentiment',
      order: 1,
      attributes: [],
      annotationTypes: ['sentiment'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'label_3',
      labelSchemaId: `schema_${projectId}`,
      name: 'Neutral',
      color: '#6B7280',
      shortcut: '3',
      description: 'Neutral sentiment',
      order: 2,
      attributes: [],
      annotationTypes: ['sentiment'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})

// Default schema for general classification (empty - user defines categories)
const getDefaultClassificationSchema = (projectId: string): LabelSchema => ({
  id: `schema_${projectId}`,
  projectId,
  toolType: 'classification',
  version: 1,
  classes: [],
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get default schema based on tool type
const getDefaultSchema = (projectId: string, toolType: ToolType = 'image'): LabelSchema => {
  switch (toolType) {
    case 'text':
      return getDefaultTextSchema(projectId)
    case 'sentiment':
      return getDefaultSentimentSchema(projectId)
    case 'classification':
      return getDefaultClassificationSchema(projectId)
    case 'image':
    default:
      return getDefaultImageSchema(projectId)
  }
}

export const getLabelSchema = (projectId: string, toolType?: ToolType): LabelSchema => {
  // Check if schema exists in store
  if (labelSchemas.has(projectId)) {
    return labelSchemas.get(projectId)!
  }
  
  // Return default schema for new projects
  const defaultSchema = getDefaultSchema(projectId)
  labelSchemas.set(projectId, defaultSchema)
  return defaultSchema
}

export const saveLabelSchema = (projectId: string, schema: LabelSchema): LabelSchema => {
  // Update the schema in store
  const updatedSchema: LabelSchema = {
    ...schema,
    projectId,
    updatedAt: new Date()
  }
  
  labelSchemas.set(projectId, updatedSchema)
  console.log(`✅ Label schema saved for project: ${projectId}`, {
    classesCount: updatedSchema.classes.length,
    version: updatedSchema.version
  })
  
  return updatedSchema
}

export const deleteLabelSchema = (projectId: string): boolean => {
  return labelSchemas.delete(projectId)
}
