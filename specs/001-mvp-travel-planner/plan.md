# Implementation Plan: Mimi Journey MVP - 旅行規劃與軌跡紀錄

**Branch**: `001-mvp-travel-planner` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mvp-travel-planner/spec.md`

## Summary

Mimi Journey MVP是一個旅行規劃與軌跡紀錄應用程式，整合Google行事曆、地圖視覺化、路線規劃與GPS追蹤功能。目前已完成Phase 1-4（登入、行事曆、地圖、地理編碼），需繼續實作Phase 5-6（停靠點管理、路線規劃、行程生成、GPS追蹤、停留點偵測）。

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.3 (frontend)
**Primary Dependencies**:
- Backend: FastAPI, SQLAlchemy 2.0+, GeoAlchemy2, httpx, python-jose
- Frontend: React 18.2, Vite 5.0, Zustand 4.4, TanStack Query 5.17, @vis.gl/react-google-maps

**Storage**: PostgreSQL 15 with PostGIS extension, Redis 7
**Testing**: pytest (backend), Vitest + Testing Library (frontend)
**Target Platform**: Web application (desktop/mobile browsers)
**Project Type**: web (separate frontend/backend)
**Performance Goals**:
- 路線計算 < 5秒
- GPS軌跡更新延遲 < 15秒
- 地圖渲染 < 3秒
- 支援100位同時使用者

**Constraints**:
- 前景GPS追蹤（非背景）
- 僅讀取行事曆（不寫回）
- 繁體中文介面
- Google Maps API 配額限制

**Scale/Scope**:
- 100位同時使用者
- 每日每使用者最多50個行事曆事件
- 軌跡點每10秒記錄一次

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> ⚠️ Constitution template未設定具體原則。以下為合理推斷的檢查項目：

| Check | Status | Notes |
|-------|--------|-------|
| 技術堆疊一致性 | ✅ Pass | 延續現有FastAPI + React架構 |
| 測試覆蓋要求 | ⚠️ Pending | 現有測試覆蓋不完整，需補齊 |
| 安全性考量 | ✅ Pass | OAuth PKCE、Redis session已實作 |
| 效能需求 | ✅ Pass | PostGIS空間索引、快取機制就位 |

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-travel-planner/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (existing: openapi.yaml)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/              # API endpoints
│   │   ├── auth.py          # [existing] Authentication
│   │   ├── calendar.py      # [existing] Calendar sync
│   │   ├── places.py        # [existing] Geocoding
│   │   ├── day_plans.py     # [NEW] Day plan CRUD
│   │   ├── stops.py         # [NEW] Stop management
│   │   ├── routes.py        # [NEW] Route calculation
│   │   └── traces.py        # [NEW] GPS tracking
│   ├── core/                # [existing] Infrastructure
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py          # [existing]
│   │   ├── place_cache.py   # [existing]
│   │   ├── day_plan.py      # [NEW] Day plan model
│   │   ├── stop.py          # [NEW] Stop model
│   │   ├── leg.py           # [NEW] Route leg model
│   │   ├── trace_point.py   # [NEW] GPS trace point
│   │   └── trace_segment.py # [NEW] Trace segment
│   ├── services/            # Business logic
│   │   ├── auth_service.py  # [existing]
│   │   ├── calendar_service.py # [existing]
│   │   ├── maps_service.py  # [existing]
│   │   ├── day_plan_service.py # [NEW]
│   │   ├── route_service.py # [NEW]
│   │   └── trace_service.py # [NEW]
│   └── schemas/             # Pydantic schemas
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

frontend/
├── src/
│   ├── components/
│   │   ├── auth/            # [existing]
│   │   ├── map/             # [existing] + enhancements
│   │   ├── planner/         # [existing] + enhancements
│   │   ├── stops/           # [NEW] Stop management UI
│   │   ├── routes/          # [NEW] Route preview
│   │   └── tracking/        # [NEW] GPS tracking UI
│   ├── pages/               # Page routes
│   ├── hooks/               # Custom hooks
│   ├── services/            # API client
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript definitions
└── tests/
```

**Structure Decision**: Web application with separate backend/frontend. Extends existing structure with new models, services, and components for remaining MVP features.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| 路線計算 | Server-side via Google Directions API | 避免在前端暴露API key，統一快取策略 |
| GPS追蹤 | Browser Geolocation API + WebSocket | 前景追蹤需即時更新，WebSocket提供低延遲 |
| 停留點偵測 | Server-side batch processing | 需分析連續軌跡點，適合後端處理 |
