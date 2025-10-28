# PixlHub Docker Setup Guide

## Quick Start

### 1. Start All Services
```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **MinIO** on ports `9000` (API) and `9001` (Console)

### 2. Check Service Status
```bash
docker-compose ps
```

### 3. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f minio
docker-compose logs -f postgres
```

### 4. Update .env File
```env
DATABASE_URL="postgresql://pixlhub:pixlhub_password@localhost:5432/pixlhub"

MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="pixlhub-assets"
MINIO_PUBLIC_URL="http://localhost:9000"
```

### 5. Run Database Migrations
```bash
npx prisma migrate dev
```

### 6. Seed Database (Optional)
```bash
npx tsx prisma/seed.ts
```

### 7. Start Nuxt Dev Server
```bash
npm run dev
```

---

## Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **MinIO Console** | http://localhost:9001 | User: `minioadmin`<br>Pass: `minioadmin` |
| **PostgreSQL** | localhost:5432 | User: `pixlhub`<br>Pass: `pixlhub_password`<br>DB: `pixlhub` |
| **Redis** | localhost:6379 | No auth |
| **Nuxt App** | http://localhost:3000 | - |

---

## Useful Commands

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes all data)
```bash
docker-compose down -v
```

### Restart a Service
```bash
docker-compose restart minio
```

### View MinIO Buckets
```bash
docker exec pixlhub-minio mc ls local
```

### Database Backup
```bash
docker exec pixlhub-postgres pg_dump -U pixlhub pixlhub > backup.sql
```

### Database Restore
```bash
cat backup.sql | docker exec -i pixlhub-postgres psql -U pixlhub pixlhub
```

---

## Production Deployment

### Switch to Managed Services

**PostgreSQL:**
- Supabase (free tier)
- Neon (serverless)
- AWS RDS
- DigitalOcean Managed Database

**MinIO → S3-Compatible:**
- **Cloudflare R2** (cheapest, no egress fees)
- AWS S3
- DigitalOcean Spaces
- Backblaze B2

**Redis:**
- Upstash (serverless)
- Redis Cloud
- AWS ElastiCache

Just update `.env` - **no code changes needed!**

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :5432
lsof -i :9000

# Kill the process or change ports in docker-compose.yml
```

### MinIO Bucket Not Created
```bash
# Access MinIO container
docker exec -it pixlhub-minio sh

# Create bucket manually
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/pixlhub-assets
mc policy set public local/pixlhub-assets
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Nuxt App (localhost:3000)         │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   PostgreSQL    MinIO       Redis
   (port 5432)  (port 9000) (port 6379)
```

All services run in isolated Docker containers with persistent volumes.
