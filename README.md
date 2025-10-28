# PixlHub - Enterprise Data Labeling Platform

<div align="center">
  <img src="https://img.shields.io/badge/Nuxt-4.1.3-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt 4" />
  <img src="https://img.shields.io/badge/Vue-3.5.22-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

## 🎯 Overview

PixlHub is a modern, scalable, and feature-rich data labeling platform built for enterprise-level annotation workflows. It combines high performance with an intuitive UX, supporting multiple annotation types including bounding boxes, polygons, segmentation, keypoints, and classification.

### ✨ Key Features

- 🎨 **Multi-Type Annotations** - Bounding boxes, polygons, segmentation, keypoints, classification
- 👥 **Multi-Tenant Architecture** - Complete tenant isolation with role-based access control
- ⚡ **High Performance** - Built with Konva.js for smooth canvas interactions
- 🎭 **Modern Design System** - Clean, minimal UI with light/dark theme support
- 📊 **Project Management** - Comprehensive dashboard and project tracking
- ⌨️ **Keyboard Shortcuts** - Optimized workflow with extensive hotkey support
- 🔄 **Undo/Redo** - Full history management for annotations
- 💾 **Auto-save** - Never lose your work

## 🏗️ Tech Stack

### Frontend
- **Framework:** Nuxt 4 (Vue 3 + TypeScript)
- **State Management:** Pinia
- **UI Components:** Naive UI + Custom Design System
- **Styling:** TailwindCSS with custom design tokens
- **Canvas Engine:** Konva.js + vue-konva
- **Icons:** Lucide Vue
- **Utilities:** VueUse

### Backend (Future)
- **Runtime:** Nuxt Nitro
- **Queue System:** BullMQ + Redis
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** MinIO (S3-compatible)
- **Auth:** Nuxt Auth

## 🚀 Quick Start

### ⚡ 5-Minute Setup

```bash
git clone https://github.com/lumax90/pixlhub-nuxt4.git
cd pixlhub-nuxt4
npm install
cp .env.example .env
docker-compose up -d
npx prisma migrate dev
npm run dev
```

**Open http://localhost:3000** 🎉

### 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference card
- **[SETUP.md](./SETUP.md)** - Complete setup guide with troubleshooting
- **[README-DOCKER.md](./README-DOCKER.md)** - Docker configuration details

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

## 📁 Project Structure

```
PixlHub/
├── assets/
│   └── css/
│       └── main.css              # Global styles & design system
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Card.vue
│   │   ├── Modal.vue
│   │   └── ThemeToggle.vue
│   ├── annotation/               # Annotation tool components
│   │   ├── AnnotationCanvas.vue
│   │   ├── AnnotationToolbar.vue
│   │   └── LabelSelector.vue
│   └── dashboard/                # Dashboard components
├── composables/
│   ├── useTheme.ts              # Theme management
│   └── useAnnotationCanvas.ts   # Canvas utilities
├── layouts/
│   └── default.vue              # Default layout with header/footer
├── pages/
│   ├── index.vue                # Landing page
│   ├── projects.vue             # Projects list
│   ├── dashboard.vue            # Analytics dashboard
│   └── annotate.vue             # Annotation tool
├── stores/
│   ├── annotation.ts            # Annotation state
│   ├── project.ts               # Project management
│   └── user.ts                  # User & auth state
├── types/
│   └── index.ts                 # TypeScript definitions
└── server/                      # Backend API (future)
```

## 🎨 Design System

PixlHub follows a strict design language with:

- **8px spacing system** - All spacing in multiples of 8
- **Typography scale** - Inter (body) + Space Grotesk (display)
- **Color palette** - Pixl Blue (#2563EB) as primary
- **Component library** - Reusable, accessible UI components
- **Dark mode** - Full theme parity

### Design Tokens

```javascript
colors: {
  pixl: {
    blue: '#2563EB',
    slate: '#1E293B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  }
}
```

## ⌨️ Keyboard Shortcuts

### Annotation Tool

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `B` | Bounding box tool |
| `P` | Polygon tool |
| `S` | Segmentation tool |
| `H` | Pan tool |
| `1-9` | Select label (1st-9th) |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Delete/Backspace` | Delete selected annotation |
| `Ctrl/Cmd + S` | Save annotations |

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Database (future)
DATABASE_URL="postgresql://user:password@localhost:5432/pixlhub"

# Redis (future)
REDIS_URL="redis://localhost:6379"

# MinIO (future)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password"
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Generate static site
npm run generate
```

### Docker Deployment (Future)

```bash
docker-compose up -d
```

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Design system & UI components
- [x] Annotation canvas with Konva.js
- [x] Bounding box tool
- [x] Label management
- [x] Project structure

### Phase 2: Core Features (In Progress)
- [ ] Polygon annotation tool
- [ ] Segmentation tool
- [ ] Keypoint annotation
- [ ] Review workflow
- [ ] Task queue system

### Phase 3: Backend Integration
- [ ] PostgreSQL + Prisma setup
- [ ] BullMQ job queues
- [ ] MinIO file storage
- [ ] Authentication system
- [ ] Multi-tenant isolation

### Phase 4: Advanced Features
- [ ] AI-assisted pre-labeling
- [ ] Real-time collaboration
- [ ] Analytics dashboard
- [ ] Export formats (COCO, YOLO, etc.)
- [ ] Plugin system

## 🤝 Contributing

Contributions are welcome! Please follow the project's code style and design guidelines.

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

Built with modern web technologies and best practices for enterprise-scale annotation workflows.

---

**PixlHub** - Precision labeling for AI excellence.
