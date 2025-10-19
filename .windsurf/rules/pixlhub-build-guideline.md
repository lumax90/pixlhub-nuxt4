---
trigger: always_on
---

# PixlData Labeling Platform (PixlHub) - Full Development Guide

## 1. Overview
This guide provides a complete, step-by-step roadmap for building a **scalable, modular, multi-tenant data labeling platform** from scratch. It combines a **Vue/nuxt 4 full-stack architecture** with modern tools to support annotation, task management, review workflows, and future AI-assisted features.

---

## 2. Core Goals
- ✅ High performance for large-scale labeling (100+ labelers concurrently)
- ✅ Modular architecture (easy to add new features)
- ✅ Multi-tenancy and role-based access
- ✅ Real-time collaboration and queue-based task management
- ✅ Maintainable, modern tech stack

---

## 3. Tech Stack Summary
| Layer | Technology | Purpose |
|--------|-------------|----------|
| **Frontend Framework** | [nuxt 4](https://nuxt.com) | Full-stack framework built on Vue 3 |
| **State Management** | [Pinia](https://pinia.vuejs.org/) | Centralized and reactive app state |
| **UI Framework** | [Naive UI](https://www.naiveui.com/) + Tailwind CSS | Component system + utility-first styling |
| **Canvas Engine** | [Konva.js](https://konvajs.org/) | Interactive annotation layers (bounding boxes, segmentation, etc.) |
| **Backend Runtime** | Nuxt Nitro (built-in) | Lightweight Node backend inside Nuxt |
| **Queue System** | [BullMQ](https://docs.bullmq.io/) | Distributed job & task management |
| **Database** | PostgreSQL | Primary data store (multi-tenant structured data) |
| **Cache / Queue Store** | Redis | Queue backend + session cache |
| **File Storage** | MinIO (S3 compatible) | Store uploaded datasets & labels |
| **Auth System** | Nuxt Auth | Tenant-based user authentication & role management |

---

## 4. High-Level Architecture
```
┌──────────────────────────────────────────────────────┐
│                     Frontend (Nuxt)                  │
│  - Naive UI + Tailwind                               │
│  - Annotation Tool (Konva.js)                        │
│  - Pinia Store (Annotation, Review, Project)         │
│  - Tenant & Role Contexts                            │
└──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────┐
│                 Backend (Nuxt Server API)            │
│  - Task Queues (BullMQ + Redis)                      │
│  - Project / Task / Review endpoints                 │
│  - Multi-Tenant Isolation                            │
│  - Integration with MinIO for storage                │
└──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────┐
│                   External Services                  │
│  - PostgreSQL: Data persistence                      │
│  - Redis: Queue and cache                            │
│  - MinIO: File storage                               │
└──────────────────────────────────────────────────────┘
```

---

## 5. Project Setup Order

### Step 1: Initialize Nuxt Project
```bash
npx nuxi init pixlhub
cd pixlhub
npm install
```

### Step 2: Add Core Dependencies
```bash
# UI & Styling
npm install naive-ui tailwindcss postcss autoprefixer

# State Management
npm install pinia

# Canvas / Annotation
npm install konva

# Queue System
npm install bullmq ioredis

# Database & ORM
npm install prisma @prisma/client

# File Storage (MinIO SDK)
npm install minio

# Authentication
npm install @sidebase/nuxt-auth
```

---

## 6. Project Structure
```
root/
│
├── app.vue
├── nuxt.config.ts
│
├── server/
│   ├── api/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── review/
│   │   └── tenants/
│   └── queues/
│       ├── annotation.queue.ts
│       ├── review.queue.ts
│       └── workers/
│           ├── annotation.worker.ts
│           └── review.worker.ts
│
├── composables/
│   ├── useAnnotation.ts
│   ├── useReview.ts
│   └── useTaskQueue.ts
│
├── stores/
│   ├── annotation.ts
│   ├── review.ts
│   ├── user.ts
│   └── project.ts
│
├── components/
│   ├── annotation/
│   ├── dashboard/
│   └── ui/
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

## 7. Core Modules

### 7.1 Annotation Module
- Built with **Konva.js**
- Supports bounding box, polygon, and segmentation tools
- Saves data to local Pinia store, syncs to backend through REST API
- Auto-assign tasks using BullMQ queues

### 7.2 Review Module
- Reviewers verify annotations and mark them as **approved** or **rejected**
- Rejected items are automatically re-queued for re-labeling
- Metrics tracked via PostgreSQL (task counts, accuracy, throughput)

### 7.3 Queue Management (BullMQ)
- Redis-based distributed queue system
- Queue types:
  - `annotationQueue`
  - `reviewQueue`
  - `retryQueue`
- Each queue has dedicated worker scripts to handle jobs asynchronously

### 7.4 Storage (MinIO)
- Store uploaded datasets, images, and label JSON files
- Future compatibility: switch to **Cloudflare R2** or AWS S3 seamlessly

### 7.5 Authentication & Multi-Tenancy
- `@sidebase/nuxt-auth` for OAuth and JWT auth
- Tenant context stored in user session
- Every resource (project, task, annotation) is tenant-scoped

---

## 8. Future-Ready Extensions
| Feature | Description |
|----------|-------------|
| **AI Pre-labeling** | Integrate with custom model via REST queue jobs |
| **Analytics Dashboard** | Aggregated metrics, task distribution, accuracy charts |
| **Realtime Collaboration** | Redis Pub/Sub or WebSocket layer |
| **Custom Roles** | Admin, Reviewer, Labeler, Observer |
| **Plugin System** | Extend frontend tools and backend pipelines modularly |

---

## 9. Deployment
| Component | Recommended Hosting |
|------------|--------------------|
| Nuxt App | Docker container (Node 20+) |
| Redis | Managed Redis or Dockerized instance |
| PostgreSQL | Managed DB or Dockerized instance |
| MinIO | Self-hosted or Cloudflare R2-compatible bucket |

### Example Docker Compose (simplified)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    env_file:
      - .env
    depends_on:
      - redis
      - db
      - minio

  redis:
    image: redis:7
    ports:
      - '6379:6379'

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: pixldata
      POSTGRES_PASSWORD: secret
    ports:
      - '5432:5432'

  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: password
    ports:
      - '9000:9000'
```

---

## 10. Development Flow Summary
| Phase | Objective |
|--------|------------|
| **1. Setup & Configuration** | Initialize Nuxt + Tailwind + Pinia + NaiveUI |
| **2. Auth & Multi-Tenancy** | Add Nuxt Auth and tenant scoping |
| **3. Annotation Tool** | Build Konva-based annotation interface |
| **4. Task Queue System** | Add BullMQ + Redis queues |
| **5. Review Flow** | Build review and re-queue logic |
| **6. Storage Integration** | Connect MinIO for datasets & outputs |
| **7. Testing & Optimization** | Load testing, caching, UI polish |
| **8. Deployment** | Dockerize and deploy backend + frontend |

---

## 11. Conclusion
This setup forms a **complete, scalable base** for a professional labeling platform. Every piece—frontend, backend, queue, storage, and auth—is designed for modularity and growth. With this foundation, you can confidently extend the system with AI integrations, analytics dashboards, or client-facing project portals without refactoring the core.

> The architecture is lean, modern, and future-proof — optimized for a real production-level labeling ecosystem.

