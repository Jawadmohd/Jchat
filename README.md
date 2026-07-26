# jChat

Real-time chat application with direct and group messaging, end-to-end encryption, status stories, reactions, read receipts, and Redis-backed caching.

## Features

- Direct and group chats with real-time messaging (Socket.io)
- End-to-end encryption (direct + group wrapped keys)
- Status stories (24h text/image updates)
- In-chat message search
- Message reactions, replies, pins, attachments
- Online presence and typing indicators
- Redis caching with graceful fallback
- Event-driven side effects (in-process or Kafka)

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, Redux RTK Query, Tailwind CSS |
| Backend | Node.js, Express, Mongoose, Socket.io |
| Data | MongoDB, Redis (optional), Kafka (optional) |
| Media | Cloudinary |

## Project structure

```
jChat/
├── backend/          # Express API + Socket.io
├── frontend/         # React SPA (nginx in Docker)
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Node.js 22+** (local dev)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (recommended for production; optional locally)
- **Cloudinary** account (avatars, file uploads, status images)
- **Docker & Docker Compose** (recommended for deployment)

---

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB, JWT, and Cloudinary credentials

npm install
npm run dev
```

API runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

Optional frontend env (defaults to local API):

```env
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

### 3. Redis (optional)

```bash
docker compose up -d redis
```

Set `REDIS_URL=redis://localhost:6379` in `backend/.env`.

---

## Deploy with Docker (recommended)

### 1. Configure environment

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

**Required for production:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (use Atlas in production) |
| `JWT_SECRET` | Long random secret — **never use the default** |
| `CLIENT_URL` | Public frontend URL (for CORS + cookies) |
| `CLOUDINARY_*` | Cloudinary cloud name, API key, secret |
| `NODE_ENV` | Set to `production` |

**Recommended:**

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Provided automatically in Compose as `redis://redis:6379` |
| `KAFKA_BROKERS` | Only if using Kafka profile (see below) |

### 2. Build and run the full stack

From the project root:

```bash
CLIENT_URL=http://localhost:5173 \
VITE_API_URL=http://localhost:8000/api \
VITE_SOCKET_URL=http://localhost:8000 \
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/jchat" \
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Redis | Internal only |

### 3. Using MongoDB Atlas

Set `MONGODB_URI` to your Atlas connection string. In Atlas:

1. Create a cluster and database user
2. Allow your server IP (or `0.0.0.0/0` for testing only)
3. Copy the connection string into `MONGODB_URI`

Example:

```bash
MONGODB_URI="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/jchat?retryWrites=true&w=majority" \
docker compose up --build -d
```

### 4. Optional: Kafka event bus

By default the app uses an **in-process event bus** (no Kafka required).

To enable Kafka:

```bash
docker compose --profile kafka up --build -d
```

And set in `backend/.env`:

```env
KAFKA_BROKERS=kafka:9092
```

---

## Build images separately

```bash
# Backend
docker build -t jchat-backend ./backend

# Frontend (bake API URLs at build time)
docker build -t jchat-frontend \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  --build-arg VITE_SOCKET_URL=https://api.yourdomain.com \
  ./frontend
```

Run backend:

```bash
docker run -p 8000:8000 --env-file backend/.env jchat-backend
```

Run frontend:

```bash
docker run -p 80:80 jchat-frontend
```

---

## Production deployment checklist

Before going live:

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (32+ random characters)
- [ ] Point `MONGODB_URI` to a managed MongoDB (Atlas)
- [ ] Set `CLIENT_URL` to your **exact** frontend origin (e.g. `https://chat.example.com`)
- [ ] Build frontend with production `VITE_API_URL` and `VITE_SOCKET_URL`
- [ ] Use HTTPS on both frontend and API (required for secure cookies)
- [ ] Configure Cloudinary and keep secrets out of git
- [ ] Run Redis in production for cache and presence
- [ ] Rotate any secrets that were ever committed or shared

### Split hosting (e.g. Vercel + Railway)

If frontend and API are on **different domains**:

1. Set backend `CLIENT_URL` to the frontend URL
2. Set frontend build args to the API URL
3. Auth uses httpOnly cookies — you may need same-site cookie tuning for cross-origin setups (same parent domain or reverse proxy is simplest)

**Simplest production setup:** put nginx (frontend) and API behind one domain with a reverse proxy:

- `https://yourdomain.com` → frontend
- `https://yourdomain.com/api` → backend (requires proxy config)

Or use subdomains with proper CORS + cookie settings:

- `https://app.yourdomain.com` → frontend  
- `https://api.yourdomain.com` → backend  

---

## Environment reference

### Backend (`backend/.env`)

```env
PORT=8000
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.com
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://redis:6379
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional
# KAFKA_BROKERS=kafka:9092
```

### Frontend (build-time)

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

---

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

---

## Health check

```bash
curl http://localhost:8000/api/health
```

---

## License

ISC
