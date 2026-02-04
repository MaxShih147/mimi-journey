# Implementation Plan: Mimi Journey MVP

**Branch**: `001-mvp-travel-planner` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mvp-travel-planner/spec.md`

## Summary

建立一個整合行事曆規劃、地圖路線、軌跡紀錄的旅行規劃 MVP 應用。使用 React + FastAPI 架構，透過 Google OAuth 登入取得行事曆事件，在地圖上顯示停靠點和路線，支援前景 GPS 軌跡追蹤和停留點自動偵測。

核心技術決策：
- **認證**: BFF (Backend-for-Frontend) 架構 + PKCE flow
- **地圖**: @vis.gl/react-google-maps (Google 官方支持)
- **空間資料**: PostGIS with GeoAlchemy2
- **軌跡追蹤**: Foreground-only with IndexedDB offline buffer

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.x (frontend)
**Primary Dependencies**:
- Backend: FastAPI 0.100+, SQLAlchemy 2.x, GeoAlchemy2, httpx, Redis
- Frontend: React 18, @vis.gl/react-google-maps, TanStack Query, Zustand
**Storage**: PostgreSQL 15+ with PostGIS 3.3+, Redis 7.x
**Testing**: pytest (backend), Vitest + Testing Library (frontend)
**Target Platform**: Web (React SPA + PWA), Server (Linux/Docker)
**Project Type**: Web application (frontend + backend)
**Performance Goals**:
- 地圖載入 < 3s
- 行程生成 < 5s
- 軌跡點上傳延遲 < 15s
- 支援 100 concurrent users
**Constraints**:
- 前景追蹤（PWA 背景限制）
- Google API 配額管理
- HttpOnly Cookie for tokens
**Scale/Scope**:
- MVP: ~15 API endpoints
- ~20 React components
- 6 main database tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 目前為模板狀態，無特定限制。以下為自我檢查：

| Gate | Status | Notes |
|------|--------|-------|
| 專案結構清晰 | PASS | Backend/Frontend 分離 |
| 測試策略定義 | PASS | Unit + Integration tests |
| 安全考量 | PASS | OAuth PKCE, HttpOnly Cookie, CORS |
| 可維護性 | PASS | 標準 REST API, OpenAPI spec |

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-travel-planner/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Technical research
├── data-model.md        # Phase 1: Database schema
├── quickstart.md        # Phase 1: Setup guide
├── contracts/           # Phase 1: API contracts
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py           # Google OAuth endpoints
│   │       ├── calendar.py       # Calendar event endpoints
│   │       ├── day_plans.py      # Day plan CRUD
│   │       ├── stops.py          # Stop management
│   │       ├── routes.py         # Route calculation
│   │       ├── traces.py         # GPS tracking
│   │       └── places.py         # Geocoding & search
│   ├── core/
│   │   ├── config.py             # Settings
│   │   ├── security.py           # Auth utilities
│   │   └── deps.py               # Dependency injection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── day_plan.py
│   │   ├── stop.py
│   │   ├── leg.py
│   │   ├── trace.py
│   │   └── place_cache.py
│   ├── schemas/
│   │   └── *.py                  # Pydantic schemas
│   ├── services/
│   │   ├── auth_service.py       # OAuth flow
│   │   ├── calendar_service.py   # Google Calendar API
│   │   ├── maps_service.py       # Geocoding, Directions
│   │   ├── planner_service.py    # Itinerary generation
│   │   └── trace_service.py      # GPS processing
│   └── main.py
├── alembic/
│   └── versions/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── requirements.txt
└── requirements-dev.txt

frontend/
├── src/
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapView.tsx
│   │   │   ├── StopMarker.tsx
│   │   │   ├── RoutePolyline.tsx
│   │   │   └── LiveTracker.tsx
│   │   ├── planner/
│   │   │   ├── DayPlanner.tsx
│   │   │   ├── StopList.tsx
│   │   │   ├── StopCard.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── TransportSelector.tsx
│   │   ├── tracking/
│   │   │   ├── TrackingRecorder.tsx
│   │   │   ├── StayPointList.tsx
│   │   │   └── ForegroundWarning.tsx
│   │   ├── auth/
│   │   │   └── LoginButton.tsx
│   │   └── common/
│   │       ├── PlaceAutocomplete.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDayPlan.ts
│   │   ├── useStops.ts
│   │   ├── useRoutes.ts
│   │   ├── useTracking.ts
│   │   └── useGeolocation.ts
│   ├── services/
│   │   ├── api.ts                # API client
│   │   ├── storage.ts            # IndexedDB for offline
│   │   └── geolocation.ts        # GPS utilities
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── trackingStore.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── PlannerPage.tsx
│   │   └── TrackerPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── components/
│   └── hooks/
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts

docker-compose.yml
.env.example
README.md
```

**Structure Decision**: 採用 Web Application 結構（Option 2），前後端分離。Backend 使用 FastAPI 標準結構，Frontend 使用 React + Vite 結構。

## Key Design Decisions

### 1. Authentication Architecture

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│ React   │────►│ FastAPI │────►│ Google   │
│ Frontend│◄────│ Backend │◄────│ OAuth    │
└─────────┘     └─────────┘     └──────────┘
     │               │
     │   HttpOnly    │   Redis
     │   Cookie      │   (tokens)
     └───────────────┴───────────────────────
```

- Frontend 不接觸 token
- Backend 管理 OAuth flow
- Session ID via HttpOnly Cookie

### 2. GPS Tracking Flow

```
┌─────────┐     ┌───────────┐     ┌─────────┐
│ Browser │────►│ IndexedDB │────►│ FastAPI │
│ GPS API │     │ (buffer)  │     │ /traces │
└─────────┘     └───────────┘     └─────────┘
     │
     │  watchPosition()
     │  10s interval / 10m distance
     ▼
┌─────────┐
│ Filter  │  accuracy > 50m → drop
│ Layer   │  speed > 83 m/s → drop
└─────────┘
```

### 3. Route Planning Flow

```
User Request
     │
     ▼
┌─────────────┐     ┌───────────────┐
│ Planner     │────►│ Google        │
│ Engine      │◄────│ Directions API│
└─────────────┘     └───────────────┘
     │
     ▼
┌─────────────┐
│ Optimize    │  Time constraints
│ & Validate  │  Conflict detection
└─────────────┘
     │
     ▼
Generated Itinerary
```

## Complexity Tracking

> 無需填寫 - Constitution 為模板狀態，無違規需要解釋。

## Phase Output Summary

| Phase | Artifact | Status |
|-------|----------|--------|
| Phase 0 | research.md | Complete |
| Phase 1 | data-model.md | Complete |
| Phase 1 | contracts/openapi.yaml | Complete |
| Phase 1 | quickstart.md | Complete |
| Phase 2 | tasks.md | Pending (`/speckit.tasks`) |

## Next Steps

1. 執行 `/speckit.tasks` 生成開發任務清單
2. 或直接開始實作，參考 `quickstart.md` 設置開發環境
