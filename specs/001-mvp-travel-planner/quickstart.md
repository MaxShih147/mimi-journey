# Quickstart Guide: Mimi Journey MVP

**Feature**: 001-mvp-travel-planner
**Date**: 2026-02-04

本文件提供開發環境設置的快速指南。

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Frontend build |
| Python | 3.11+ | Backend runtime |
| PostgreSQL | 15+ | Database |
| PostGIS | 3.3+ | Spatial extension |
| Redis | 7.x | Cache & session |
| Docker | 24+ | Development containers |

### External Services

| Service | Purpose | Setup Location |
|---------|---------|----------------|
| Google Cloud Console | OAuth, Calendar, Maps APIs | console.cloud.google.com |

---

## Quick Setup (Docker)

### 1. Clone and Setup Environment

```bash
# Clone repository
git clone <repo-url> mimi-journey
cd mimi-journey

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

編輯 `.env` 檔案：

```env
# Database
DATABASE_URL=postgresql://mimi:mimi_dev@localhost:5432/mimi_journey
REDIS_URL=redis://localhost:6379

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Google Maps API
GOOGLE_MAPS_API_KEY=your-maps-api-key

# Security
SESSION_SECRET=your-random-secret-key-min-32-chars
COOKIE_DOMAIN=localhost

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### 3. Start Services with Docker Compose

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
```

### 4. Initialize Database

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# (Optional) Seed sample data
docker compose exec backend python scripts/seed_data.py
```

### 5. Access Applications

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Manual Setup (Without Docker)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Setup database
createdb mimi_journey
psql -d mimi_journey -c "CREATE EXTENSION postgis;"
psql -d mimi_journey -c "CREATE EXTENSION \"uuid-ossp\";"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## Google Cloud Setup

### 1. Create Project

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案或選擇現有專案
3. 記下 Project ID

### 2. Enable APIs

在 API Library 中啟用以下 API：

- Google Calendar API
- Maps JavaScript API
- Geocoding API
- Directions API
- Places API

### 3. Configure OAuth Consent Screen

1. 前往 **APIs & Services > OAuth consent screen**
2. 選擇 **External** user type
3. 填寫應用程式資訊
4. 新增 Scopes：
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`

### 4. Create OAuth Credentials

1. 前往 **APIs & Services > Credentials**
2. 建立 **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:8000`
5. Authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google/callback`
6. 下載或複製 Client ID 和 Client Secret

### 5. Create API Key

1. 在 Credentials 頁面建立 **API Key**
2. 限制 API Key：
   - Application restrictions: HTTP referrers
   - Website restrictions: `localhost:*`
   - API restrictions: 只允許 Maps 相關 API
3. 複製 API Key

---

## Project Structure

```
mimi-journey/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── calendar.py
│   │   │       ├── day_plans.py
│   │   │       ├── places.py
│   │   │       ├── routes.py
│   │   │       ├── stops.py
│   │   │       └── traces.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── deps.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── day_plan.py
│   │   │   ├── stop.py
│   │   │   ├── leg.py
│   │   │   ├── trace.py
│   │   │   └── place_cache.py
│   │   ├── schemas/
│   │   │   └── *.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── calendar_service.py
│   │   │   ├── maps_service.py
│   │   │   ├── planner_service.py
│   │   │   └── trace_service.py
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── StopMarker.tsx
│   │   │   │   └── RoutePolyline.tsx
│   │   │   ├── planner/
│   │   │   │   ├── DayPlanner.tsx
│   │   │   │   ├── StopList.tsx
│   │   │   │   └── Timeline.tsx
│   │   │   ├── tracking/
│   │   │   │   ├── TrackingRecorder.tsx
│   │   │   │   └── LiveTracker.tsx
│   │   │   └── common/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDayPlan.ts
│   │   │   ├── useTracking.ts
│   │   │   └── useGeolocation.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── storage.ts
│   │   │   └── geolocation.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── PlannerPage.tsx
│   │   │   └── TrackerPage.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── specs/
│   └── 001-mvp-travel-planner/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md
│       └── contracts/
│           └── openapi.yaml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Backend
cd backend
black .
ruff check .
mypy .

# Frontend
cd frontend
npm run lint
npm run typecheck
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Common Issues

### PostGIS Extension Not Found

```bash
# Ubuntu/Debian
sudo apt install postgresql-15-postgis-3

# macOS (Homebrew)
brew install postgis
```

### Google OAuth Redirect Error

確認 redirect URI 完全匹配：
- 包含 protocol (`http://` or `https://`)
- 包含 port 號
- 結尾沒有多餘的 `/`

### CORS Issues in Development

確認 backend CORS 設置包含 frontend origin：

```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Next Steps

1. 完成環境設置後，閱讀 `spec.md` 了解功能需求
2. 參考 `contracts/openapi.yaml` 了解 API 設計
3. 查看 `data-model.md` 了解資料結構
4. 執行 `/speckit.tasks` 生成開發任務
