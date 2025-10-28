# ⚡ PixlHub - 5 Minute Quickstart

## 🎯 On a New Computer

```bash
# 1. Clone
git clone https://github.com/lumax90/pixlhub-nuxt4.git
cd pixlhub-nuxt4

# 2. Install
npm install

# 3. Setup .env
cp .env.example .env

# 4. Start Docker
docker-compose up -d

# 5. Setup Database
npx prisma migrate dev

# 6. Run App
npm run dev
```

**Open http://localhost:3000** 🎉

---

## 📋 Prerequisites

- Node.js 20+
- Docker Desktop
- Git

---

## 🔧 Services

| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | pixlhub / pixlhub_password |

---

## 🛑 Stop Everything

```bash
docker-compose down
```

---

## 🔄 Reset Everything

```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
```

---

**For detailed guide, see [SETUP.md](./SETUP.md)**
