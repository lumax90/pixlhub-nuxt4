// PixlHub Core Types

export type Theme = 'light' | 'dark'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'admin' | 'reviewer' | 'labeler' | 'observer'

export interface Tenant {
  id: string
  name: string
  slug: string
  settings: TenantSettings
  createdAt: Date
}

export interface TenantSettings {
  theme: Theme
  allowedAnnotationTypes: AnnotationType[]
  maxConcurrentTasks: number
}

export interface Project {
  id: string
  tenantId: string
  name: string
  description: string
  status: ProjectStatus
  annotationType: AnnotationType
  totalTasks: number
  completedTasks: number
  labelSchema?: LabelSchema
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export type AnnotationType = 'bounding-box' | 'polygon' | 'segmentation' | 'keypoint' | 'classification'

// Geometry Types for Annotations
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface Polygon {
  points: Point[]
}

export interface Task {
  id: string
  projectId: string
  datasetItemId: string
  assignedTo?: string
  status: TaskStatus
  priority: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'review' | 'rejected' | 'approved'

export interface DatasetItem {
  id: string
  projectId: string
  url: string
  filename: string
  metadata: Record<string, any>
  width?: number
  height?: number
  createdAt: Date
}

export interface Annotation {
  id: string
  taskId: string
  type: AnnotationType
  labelId: string
  bbox?: BoundingBox
  point?: Point
  polygon?: Polygon
  visible: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Label Schema Types
export interface LabelSchema {
  id: string
  projectId: string
  classes: LabelClass[]
  version: number
  createdAt: Date
  updatedAt: Date
}

export interface LabelClass {
  id: string
  labelSchemaId: string
  name: string
  color: string
  shortcut?: string
  description?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

// Legacy Label type (deprecated - use LabelClass)
export interface Label {
  id: string
  projectId: string
  name: string
  color: string
  description?: string
  hotkey?: string
  order: number
}

export interface Review {
  id: string
  taskId: string
  reviewerId: string
  status: ReviewStatus
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

// UI Component Types

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: any
}

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search'

export interface InputProps {
  type?: InputType
  placeholder?: string
  disabled?: boolean
  error?: string
  icon?: any
}

export interface ModalProps {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
}

// Canvas/Annotation Tool Types

export interface CanvasState {
  scale: number
  offsetX: number
  offsetY: number
  selectedAnnotationId?: string
  tool: AnnotationTool
  isDrawing: boolean
}

export type AnnotationTool = 'select' | 'bbox' | 'polygon' | 'segmentation' | 'keypoint' | 'pan' | 'zoom'

export interface CanvasImage {
  id: string
  name: string
  url: string
  width: number
  height: number
  annotations: Annotation[]
}

export interface ToolConfig {
  name: AnnotationTool
  icon: any
  hotkey: string
  cursor: string
}
