# 🚀 PixlHub - Complete Setup Guide

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 10+** (comes with Node.js)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/lumax90/pixlhub-nuxt4.git
cd pixlhub-nuxt4
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# The default values work out of the box!
# No need to edit unless you want custom settings
```

### Step 4: Start Docker Services

```bash
# Start PostgreSQL, MinIO, and Redis
docker-compose up -d

# Wait 10 seconds for services to start
```

### Step 5: Setup Database

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npx tsx prisma/seed.ts
```

### Step 6: Start the App

```bash
npm run dev
```

**🎉 Done! Open http://localhost:3000**

---

## 🔧 What Just Happened?

### Services Running:

| Service | URL | Purpose |
|---------|-----|---------|
| **PixlHub App** | http://localhost:3000 | Main application |
| **PostgreSQL** | localhost:5432 | Database |
| **MinIO Console** | http://localhost:9001 | File storage admin |
| **MinIO API** | http://localhost:9000 | File storage API |
| **Redis** | localhost:6379 | Queue system |

### Default Credentials:

**MinIO Console (http://localhost:9001):**
- Username: `minioadmin`
- Password: `minioadmin`

**PostgreSQL:**
- User: `pixlhub`
- Password: `pixlhub_password`
- Database: `pixlhub`

---

## 📁 Project Structure

```
pixlhub-nuxt4/
├── app/                          # Frontend application
│   ├── components/              # Vue components
│   │   ├── annotation/         # Annotation tools
│   │   └── project/            # Project management
│   ├── composables/            # Reusable logic
│   ├── pages/                  # Routes
│   ├── stores/                 # Pinia state management
│   └── utils/                  # Utilities (sync queue, etc)
├── server/                      # Backend API
│   ├── api/                    # API endpoints
│   ├── services/               # Business logic
│   └── utils/                  # Server utilities
├── prisma/                      # Database
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
├── docker-compose.yml          # Docker services
└── .env                        # Environment variables
```

---

## 🎨 Features Available

### ✅ Working Now:
- Image annotation (bounding boxes, polygons, points)
- Label schema management
- Task queue system
- Review workflow
- Export (COCO, YOLO, Pascal VOC, JSON, CSV)
- IndexedDB sync queue (never lose data)
- Dark/light theme
- Keyboard shortcuts
- Time tracking
- Notifications
- Comments

### 🚧 Coming Soon:
- Text annotation
- Audio annotation
- Video annotation
- RLHF annotation
- Multi-user collaboration
- AI-assisted labeling

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run preview

# Database commands
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Run migrations
npx prisma migrate reset       # Reset database

# Docker commands
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker-compose logs -f         # View logs
docker-compose ps              # Check status
```

---

## 🔍 Troubleshooting

### "Port 5432 already in use"
Another PostgreSQL is running. Either:
```bash
# Stop it
brew services stop postgresql

# Or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead
```

### "MinIO bucket not found"
The bucket is created automatically, but if it fails:
```bash
# Access MinIO console: http://localhost:9001
# Login with minioadmin/minioadmin
# Create bucket: pixlhub-assets
# Set policy: public
```

### "Database migration failed"
```bash
# Reset everything
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
```

### "npm install fails"
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Deploying to Another Computer

### Option 1: Fresh Clone (Recommended)

```bash
# On new computer
git clone https://github.com/lumax90/pixlhub-nuxt4.git
cd pixlhub-nuxt4
npm install
cp .env.example .env
docker-compose up -d
npx prisma migrate dev
npm run dev
```

### Option 2: With Your Data

```bash
# On old computer - backup database
docker exec pixlhub-postgres pg_dump -U pixlhub pixlhub > backup.sql

# Copy to new computer:
# - backup.sql
# - .env file

# On new computer
git clone https://github.com/lumax90/pixlhub-nuxt4.git
cd pixlhub-nuxt4
npm install
# Copy your .env file here
docker-compose up -d
npx prisma migrate dev
cat backup.sql | docker exec -i pixlhub-postgres psql -U pixlhub pixlhub
npm run dev
```

---

## 📊 Database Schema

The app uses PostgreSQL with Prisma ORM. Main tables:

- **Project** - Annotation projects
- **Label** - Label definitions (with schema)
- **Asset** - Uploaded files/data
- **Task** - Work assignments
- **Annotation** - User annotations
- **Export** - Export history
- **Notification** - User notifications

View schema: `prisma/schema.prisma`

---

## 🔐 Security Notes

### ⚠️ Important:
- `.env` file is gitignored (contains secrets)
- Never commit `.env` to git
- Change default passwords in production
- Use managed services for production (not Docker)

### Production Checklist:
- [ ] Change MinIO credentials
- [ ] Change PostgreSQL password
- [ ] Use managed database (Supabase, Neon)
- [ ] Use S3/R2 instead of MinIO
- [ ] Enable HTTPS
- [ ] Add authentication
- [ ] Set up backups

---

## 📚 Additional Resources

- **Docker Setup:** See `README-DOCKER.md`
- **Export Guide:** See `EXPORT_GUIDE.md`
- **Tool Status:** See `TOOLS_STATUS_COMPLETE.md`
- **API Docs:** Coming soon

---

## 🆘 Need Help?

1. Check this guide first
2. Check `README-DOCKER.md` for Docker issues
3. Check GitHub Issues
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version)

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] App loads at http://localhost:3000
- [ ] Can create a project
- [ ] Can upload images
- [ ] Can create labels
- [ ] Can annotate images
- [ ] Can submit annotations
- [ ] Can export data
- [ ] MinIO console accessible
- [ ] Database has data (check Prisma Studio)

---

**🎉 You're all set! Happy annotating!**
