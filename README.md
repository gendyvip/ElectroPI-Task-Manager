# ElectroPI Task Manager

Full-stack team task board built with Node.js, Express, MongoDB, and Next.js.

Authenticated users can create projects, manage tasks, assign work, and track status changes. Roles: **Admin** and **Member**.

---

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript, MongoDB / Mongoose |
| Auth | JWT (Bearer), bcrypt password hashing |
| Validation | Zod |
| Frontend | Next.js (App Router), TypeScript, Tailwind, React Query |
| Tests | Jest + Supertest + mongodb-memory-server |

---

## Architecture overview

```
Client (Next.js)
  → Authorization: Bearer <JWT>
API (/api/v1)
  → validate (Zod)
  → authenticate / authorize
  → service
  → mongoose model
  → JSON { success, message, data }
```

**Project layout**

```
ElectroPI-Management/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # env, database, cors
│   │   ├── middleware/      # auth, roles, validation, errors
│   │   ├── models/          # User, Project, Task
│   │   ├── routes/          # REST routes
│   │   ├── services/        # business logic
│   │   ├── validators/      # Zod schemas
│   │   └── scripts/seed.ts  # demo data
│   └── tests/               # API tests
├── frontend/                # Next.js app
├── docs/                    # Postman collection
├── docker-compose.yml       # MongoDB only
└── README.md
```

**Roles**

- `ADMIN` — create/update/delete projects, manage members (must also be a project member for that project)
- `MEMBER` — access assigned projects, create/update/delete tasks inside those projects

Public registration always creates a `MEMBER`. Admin is created via seed.

---

## Prerequisites

- Node.js **20+**
- npm **9+**
- Docker Desktop (recommended for MongoDB) **or** a local MongoDB instance

---

## Environment variables

Copy the sample file (no real secrets — placeholders only):

```bash
cp backend/.env.example backend/.env
```

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs (min 32 chars) |
| `NODE_ENV` | No | `development` | `development` / `test` / `production` |
| `PORT` | No | `4000` | API port |
| `JWT_EXPIRES_IN` | No | `1d` | Token lifetime (e.g. `1h`, `1d`) |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Password hash cost |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed frontend origin |
| `SEED_ADMIN_EMAIL` | No | `admin@taskmanager.local` | Seed admin email |
| `SEED_ADMIN_PASSWORD` | No | `Admin@12345` | Seed admin password |
| `SEED_ADMIN_NAME` | No | `System Admin` | Seed admin display name |

Sample Docker URI (matches `docker-compose.yml`):

```env
MONGODB_URI=mongodb://admin:changeme@localhost:27017/task_manager?authSource=admin
JWT_SECRET=dev-jwt-secret-change-me-in-production-min-32-chars
```

### Frontend (optional)

Defaults work for local development (`frontend/.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `/api/v1` | API base URL (Next.js rewrite proxies to backend) |
| `BACKEND_URL` | `http://localhost:4000` | Backend target for the rewrite |

---

## Database setup

### Option A — Docker (recommended)

```bash
docker compose up -d mongodb
```

This starts MongoDB 7 on port `27017` with:

- User: `admin`
- Password: `changeme`
- Database: `task_manager`
- Auth source: `admin`

Stop:

```bash
docker compose down
```

### Option B — Local MongoDB

1. Install and start MongoDB locally.
2. Set `MONGODB_URI` in `backend/.env`, for example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/task_manager
```

Collections (`users`, `projects`, `tasks`) are created automatically by Mongoose on first use. No separate migration step is required.

---

## Setup instructions

From the repository root:

```bash
# 1) Environment
cp backend/.env.example backend/.env

# 2) Database
docker compose up -d mongodb

# 3) Install dependencies (workspaces)
npm install

# 4) Seed demo data (optional but recommended)
npm run seed

# 5) Run API + web app (two terminals)
npm run dev:backend
npm run dev:frontend
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API base | http://localhost:4000/api/v1 |

---

## Seed data & test credentials

```bash
npm run seed
```

Creates (if missing):

- Admin user
- Two member users (Alice, Bob)
- One demo project with sample tasks

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@taskmanager.local` | `Admin@12345` |
| Member | `alice@taskmanager.local` | `Member@12345` |
| Member | `bob@taskmanager.local` | `Member@12345` |

You can also register a new Member from `/register`.

---

## Test commands

```bash
# Backend API tests (Jest + Supertest)
npm test

# Lint
npm run lint

# Production builds
npm run build
```

Tests use an in-memory MongoDB (or `TEST_MONGODB_URI` if set) and cover auth, project access, task filters, and authorization.

---

## API documentation

Base URL: `http://localhost:4000/api/v1`

Auth header: `Authorization: Bearer <token>`

### Postman

File: [`docs/ElectroPI-API.postman_collection.json`](docs/ElectroPI-API.postman_collection.json)

1. Import it in Postman
2. Run `npm run seed` and `npm run dev:backend`
3. Call `auth/login`, copy the token from the response
4. Paste it into collection variable `token`
5. Same for `projectId` / `taskId` / `userId` when you need them

### Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/auth/register` | No | Creates MEMBER |
| `POST` | `/auth/login` | No | Returns token |
| `POST` | `/auth/logout` | No | — |
| `GET` | `/auth/me` | Yes | Current user |
| `GET` | `/users/search?q=` | Yes | For adding members |
| `POST` | `/projects` | Admin | Create |
| `GET` | `/projects` | Yes | List my projects |
| `GET` | `/projects/:id` | Yes | Get one |
| `PATCH` | `/projects/:id` | Admin | Update |
| `DELETE` | `/projects/:id` | Admin | Delete |
| `POST` | `/projects/:id/members` | Admin | `{ userId }` |
| `DELETE` | `/projects/:id/members/:userId` | Admin | Remove member |
| `POST` | `/projects/:projectId/tasks` | Yes | Create task |
| `GET` | `/projects/:projectId/tasks` | Yes | Filters: status, priority, assignee |
| `GET` | `/tasks/:id` | Yes | Get task |
| `PATCH` | `/tasks/:id` | Yes | Update |
| `DELETE` | `/tasks/:id` | Yes | Delete |

Statuses: `TODO`, `IN_PROGRESS`, `DONE`  
Priorities: `LOW`, `MEDIUM`, `HIGH`

---

## Deploy frontend on Vercel

The **Next.js app** deploys to Vercel. The **Express API + MongoDB** stay on another host (Railway, Render, Fly.io, VPS, etc.).

### 1) Backend first

Deploy the API with env:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | your Atlas / hosted Mongo URI |
| `JWT_SECRET` | strong secret (≥ 32 chars) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `NODE_ENV` | `production` |

API base should be reachable as `https://your-api.example.com/api/v1`.

### 2) Import the repo in Vercel

1. New Project → import this GitHub repo  
2. **Root Directory:** `frontend`  
3. Framework: Next.js (auto)  
4. Install/build commands come from `frontend/vercel.json` (npm workspaces from repo root)

### 3) Vercel environment variables

| Variable | Value |
|----------|--------|
| `BACKEND_URL` | `https://your-api.example.com` (no trailing slash) |
| `NEXT_PUBLIC_API_URL` | `/api/v1` (keep relative; Next rewrite proxies to `BACKEND_URL`) |

Redeploy after saving env vars.

### 4) Smoke check

- Open the Vercel URL → login / register  
- Confirm API calls work (Network tab → `/api/v1/...`)

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start API with hot reload (`:4000`) |
| `npm run dev:frontend` | Start Next.js (`:3000`) |
| `npm run seed` | Seed Admin / Members / demo project |
| `npm test` | Run backend tests |
| `npm run lint` | Lint backend + frontend |
| `npm run build` | Build backend + frontend |
| `npm run build:backend` | Build API only |
| `npm run build:frontend` | Build web app only |

---

## Features covered

- Register / login with hashed passwords and JWT
- Protected routes + Admin / Member roles
- Projects CRUD; Admin adds/removes members
- Users only see projects they belong to
- Tasks CRUD with title, description, status, priority, due date, creator, assignee
- Statuses: `TODO`, `IN_PROGRESS`, `DONE`
- Filter tasks by status, priority, assignee
- Frontend: auth screens, project list, task table, forms, loading/empty/error states
