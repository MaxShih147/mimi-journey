# Tasks: Mimi Journey MVP - 旅行規劃與軌跡紀錄

**Input**: Design documents from `/specs/001-mvp-travel-planner/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Not explicitly requested - test tasks not included. Add `/speckit.tasks --with-tests` to include tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and frontend

- [x] T001 Create project directory structure per plan.md (backend/, frontend/, docker-compose.yml)
- [x] T002 [P] Initialize Python backend with FastAPI in backend/requirements.txt and backend/app/main.py
- [x] T003 [P] Initialize React frontend with Vite in frontend/package.json and frontend/vite.config.ts
- [x] T004 [P] Create docker-compose.yml with PostgreSQL, PostGIS, and Redis services
- [x] T005 [P] Create .env.example with all required environment variables
- [x] T006 [P] Configure backend linting (ruff) in backend/pyproject.toml
- [x] T007 [P] Configure frontend linting (ESLint) and TypeScript in frontend/tsconfig.json
- [x] T008 Create backend/app/core/config.py with Pydantic settings management

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM Setup

- [x] T009 Setup Alembic migrations framework in backend/alembic/
- [x] T010 Create PostGIS extension initialization migration in backend/alembic/versions/
- [x] T011 Create enum types (plan_status, transport_mode, stop_type, stop_source, trace_status, staypoint_status) in backend/app/models/enums.py
- [x] T012 Create base SQLAlchemy model with UUID and timestamp mixins in backend/app/models/base.py

### Backend Core Infrastructure

- [x] T013 [P] Implement CORS middleware configuration in backend/app/main.py
- [x] T014 [P] Create API router structure in backend/app/api/v1/__init__.py
- [x] T015 [P] Implement error handling middleware in backend/app/core/exceptions.py
- [x] T016 [P] Setup Redis connection pool in backend/app/core/redis.py
- [x] T017 Create database session dependency in backend/app/core/deps.py

### Frontend Core Infrastructure

- [x] T018 [P] Setup TanStack Query provider in frontend/src/App.tsx
- [x] T019 [P] Create API client with credentials handling in frontend/src/services/api.ts
- [x] T020 [P] Setup Zustand auth store in frontend/src/stores/authStore.ts
- [x] T021 [P] Create TypeScript types from OpenAPI spec in frontend/src/types/index.ts
- [x] T022 [P] Configure Google Maps APIProvider wrapper in frontend/src/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Google 登入與行事曆事件讀取 (Priority: P1) 🎯 MVP

**Goal**: Users can login with Google and see their calendar events for the day

**Independent Test**: User logs in → sees calendar event list (no map needed)

### Backend Implementation for US1

- [x] T023 [P] [US1] Create User model with OAuth fields in backend/app/models/user.py
- [x] T024 [US1] Create User Pydantic schemas in backend/app/schemas/user.py
- [x] T025 [US1] Create User migration in backend/alembic/versions/
- [x] T026 [US1] Implement OAuth PKCE flow utilities in backend/app/core/security.py
- [x] T027 [US1] Implement auth_service with Google OAuth in backend/app/services/auth_service.py
- [x] T028 [US1] Implement calendar_service for Google Calendar API in backend/app/services/calendar_service.py
- [x] T029 [US1] Create auth routes (login, callback, me, logout) in backend/app/api/v1/auth.py
- [x] T030 [US1] Create calendar routes (GET /calendar/events) in backend/app/api/v1/calendar.py
- [x] T031 [US1] Implement session management with Redis in backend/app/services/auth_service.py
- [x] T032 [US1] Add token refresh middleware in backend/app/core/deps.py

### Frontend Implementation for US1

- [x] T033 [P] [US1] Create useAuth hook in frontend/src/hooks/useAuth.ts
- [x] T034 [P] [US1] Create LoginButton component in frontend/src/components/auth/LoginButton.tsx
- [x] T035 [US1] Create LoginPage in frontend/src/pages/LoginPage.tsx
- [x] T036 [US1] Create CalendarEventList component in frontend/src/components/planner/CalendarEventList.tsx
- [x] T037 [US1] Create useDayPlan hook for calendar events in frontend/src/hooks/useDayPlan.ts
- [x] T038 [US1] Setup protected route wrapper in frontend/src/App.tsx
- [x] T039 [US1] Create PlannerPage shell with event list in frontend/src/pages/PlannerPage.tsx

**Checkpoint**: Users can login and see calendar events - MVP complete for US1

---

## Phase 4: User Story 2 - 事件地點地理編碼與地圖顯示 (Priority: P2)

**Goal**: Calendar event locations are geocoded and displayed as markers on the map

**Independent Test**: Events with locations appear as pins on map, clicking shows details

### Backend Implementation for US2

- [x] T040 [P] [US2] Create PlaceCache model in backend/app/models/place_cache.py
- [x] T041 [US2] Create PlaceCache Pydantic schemas in backend/app/schemas/place.py
- [x] T042 [US2] Create PlaceCache migration in backend/alembic/versions/
- [x] T043 [US2] Implement maps_service with geocoding in backend/app/services/maps_service.py
- [x] T044 [US2] Create places routes (geocode, reverse-geocode, search) in backend/app/api/v1/places.py
- [x] T045 [US2] Add geocoding to calendar_service event processing in backend/app/services/calendar_service.py
- [x] T046 [US2] Implement place cache lookup and storage in backend/app/services/maps_service.py

### Frontend Implementation for US2

- [x] T047 [P] [US2] Create MapView component with @vis.gl/react-google-maps in frontend/src/components/map/MapView.tsx
- [x] T048 [P] [US2] Create StopMarker component in frontend/src/components/map/StopMarker.tsx
- [x] T049 [US2] Create InfoWindow component for marker details in frontend/src/components/map/StopInfoWindow.tsx
- [x] T050 [US2] Integrate MapView into PlannerPage in frontend/src/pages/PlannerPage.tsx
- [x] T051 [US2] Add map marker click handling and info display in frontend/src/components/map/MapView.tsx

**Checkpoint**: Calendar events show on map with clickable markers - US2 complete

---

## Phase 5: User Story 3 - 手動新增停靠點與路線預覽 (Priority: P3)

**Goal**: Users can manually add stops and preview routes between them

**Independent Test**: Add stop via search → see route polyline and ETA on map

### Backend Implementation for US3

- [ ] T052 [P] [US3] Create DayPlan model in backend/app/models/day_plan.py
- [ ] T053 [P] [US3] Create Stop model with PostGIS geometry in backend/app/models/stop.py
- [ ] T054 [P] [US3] Create Leg model in backend/app/models/leg.py
- [ ] T055 [US3] Create DayPlan, Stop, Leg Pydantic schemas in backend/app/schemas/day_plan.py
- [ ] T056 [US3] Create DayPlan, Stop, Leg migrations in backend/alembic/versions/
- [ ] T057 [US3] Implement directions API in maps_service in backend/app/services/maps_service.py
- [ ] T058 [US3] Create day_plans routes (CRUD) in backend/app/api/v1/day_plans.py
- [ ] T059 [US3] Create stops routes (add, update, delete, reorder) in backend/app/api/v1/stops.py
- [ ] T060 [US3] Create routes preview endpoint in backend/app/api/v1/routes.py

### Frontend Implementation for US3

- [ ] T061 [P] [US3] Create PlaceAutocomplete component in frontend/src/components/common/PlaceAutocomplete.tsx
- [ ] T062 [P] [US3] Create StopList component with drag-drop in frontend/src/components/planner/StopList.tsx
- [ ] T063 [P] [US3] Create StopCard component in frontend/src/components/planner/StopCard.tsx
- [ ] T064 [P] [US3] Create TransportSelector component in frontend/src/components/planner/TransportSelector.tsx
- [ ] T065 [P] [US3] Create RoutePolyline component in frontend/src/components/map/RoutePolyline.tsx
- [ ] T066 [US3] Create useStops hook in frontend/src/hooks/useStops.ts
- [ ] T067 [US3] Create useRoutes hook for route preview in frontend/src/hooks/useRoutes.ts
- [ ] T068 [US3] Integrate stop management into PlannerPage in frontend/src/pages/PlannerPage.tsx
- [ ] T069 [US3] Implement drag-drop reordering with route recalculation in frontend/src/components/planner/StopList.tsx

**Checkpoint**: Users can add stops, reorder them, and see routes - US3 complete

---

## Phase 6: User Story 4 - 一鍵生成當天行程 (Priority: P4)

**Goal**: System generates complete itinerary with timeline and route legs

**Independent Test**: Click "Generate" → see timeline with arrival/departure times and conflicts

### Backend Implementation for US4

- [ ] T070 [US4] Implement planner_service with itinerary generation in backend/app/services/planner_service.py
- [ ] T071 [US4] Add conflict detection (time overlap, insufficient travel time) in backend/app/services/planner_service.py
- [ ] T072 [US4] Add buffer time calculation between stops in backend/app/services/planner_service.py
- [ ] T073 [US4] Create generate endpoint in backend/app/api/v1/day_plans.py
- [ ] T074 [US4] Create GeneratedItinerary schema in backend/app/schemas/day_plan.py

### Frontend Implementation for US4

- [ ] T075 [P] [US4] Create Timeline component in frontend/src/components/planner/Timeline.tsx
- [ ] T076 [P] [US4] Create ConflictAlert component in frontend/src/components/planner/ConflictAlert.tsx
- [ ] T077 [US4] Create DayPlanner container component in frontend/src/components/planner/DayPlanner.tsx
- [ ] T078 [US4] Add generate itinerary action to useDayPlan hook in frontend/src/hooks/useDayPlan.ts
- [ ] T079 [US4] Integrate timeline view into PlannerPage in frontend/src/pages/PlannerPage.tsx

**Checkpoint**: Full itinerary generation working - US4 complete

---

## Phase 7: User Story 5 - 前景 GPS 軌跡追蹤 (Priority: P5)

**Goal**: Users can start GPS tracking and see their live trace on the map

**Independent Test**: Click "Start Tracking" → move → see polyline drawn on map in real-time

### Backend Implementation for US5

- [ ] T080 [P] [US5] Create Trace model in backend/app/models/trace.py
- [ ] T081 [P] [US5] Create TracePoint model with PostGIS in backend/app/models/trace.py
- [ ] T082 [P] [US5] Create TraceSegment model in backend/app/models/trace.py
- [ ] T083 [US5] Create Trace, TracePoint, TraceSegment Pydantic schemas in backend/app/schemas/trace.py
- [ ] T084 [US5] Create Trace migrations in backend/alembic/versions/
- [ ] T085 [US5] Implement trace_service for point ingestion in backend/app/services/trace_service.py
- [ ] T086 [US5] Implement 3-layer GPS filtering (accuracy, outlier, speed) in backend/app/services/trace_service.py
- [ ] T087 [US5] Implement polyline simplification (Douglas-Peucker) in backend/app/services/trace_service.py
- [ ] T088 [US5] Create traces routes (start, stop, upload points) in backend/app/api/v1/traces.py

### Frontend Implementation for US5

- [ ] T089 [P] [US5] Create IndexedDB storage service in frontend/src/services/storage.ts
- [ ] T090 [P] [US5] Create geolocation service with watchPosition in frontend/src/services/geolocation.ts
- [ ] T091 [P] [US5] Create useGeolocation hook in frontend/src/hooks/useGeolocation.ts
- [ ] T092 [P] [US5] Create trackingStore with Zustand in frontend/src/stores/trackingStore.ts
- [ ] T093 [US5] Create useTracking hook with offline buffering in frontend/src/hooks/useTracking.ts
- [ ] T094 [US5] Create TrackingRecorder component (start/stop UI) in frontend/src/components/tracking/TrackingRecorder.tsx
- [ ] T095 [US5] Create ForegroundWarning banner component in frontend/src/components/tracking/ForegroundWarning.tsx
- [ ] T096 [US5] Create LiveTracker component for polyline in frontend/src/components/map/LiveTracker.tsx
- [ ] T097 [US5] Create TrackerPage with map and recorder in frontend/src/pages/TrackerPage.tsx
- [ ] T098 [US5] Implement batch sync on network recovery in frontend/src/hooks/useTracking.ts

**Checkpoint**: Live GPS tracking with offline support - US5 complete

---

## Phase 8: User Story 6 - 停留點自動偵測 (Priority: P6)

**Goal**: System detects stay points from GPS trace and suggests them as rest stops

**Independent Test**: After tracking with stops > 5 min → see detected stay points in list

### Backend Implementation for US6

- [ ] T099 [P] [US6] Create StayPoint model with PostGIS in backend/app/models/trace.py
- [ ] T100 [US6] Create StayPoint Pydantic schemas in backend/app/schemas/trace.py
- [ ] T101 [US6] Create StayPoint migration in backend/alembic/versions/
- [ ] T102 [US6] Implement DBSCAN clustering for stay point detection in backend/app/services/trace_service.py
- [ ] T103 [US6] Add stay point detection trigger on trace completion in backend/app/services/trace_service.py
- [ ] T104 [US6] Create stay-points routes (list, update status) in backend/app/api/v1/traces.py
- [ ] T105 [US6] Add reverse geocoding for stay point names in backend/app/services/trace_service.py

### Frontend Implementation for US6

- [ ] T106 [P] [US6] Create StayPointList component in frontend/src/components/tracking/StayPointList.tsx
- [ ] T107 [P] [US6] Create StayPointCard component with confirm/ignore actions in frontend/src/components/tracking/StayPointCard.tsx
- [ ] T108 [US6] Create StayPointMarker component in frontend/src/components/map/StayPointMarker.tsx
- [ ] T109 [US6] Add stay point management to useTracking hook in frontend/src/hooks/useTracking.ts
- [ ] T110 [US6] Integrate stay point list into TrackerPage in frontend/src/pages/TrackerPage.tsx

**Checkpoint**: Stay point detection working - US6 complete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T111 [P] Create LoadingSpinner component in frontend/src/components/common/LoadingSpinner.tsx
- [ ] T112 [P] Add error boundary component in frontend/src/components/common/ErrorBoundary.tsx
- [ ] T113 [P] Configure PWA manifest in frontend/public/manifest.json
- [ ] T114 [P] Add service worker for offline support in frontend/public/sw.js
- [ ] T115 Create responsive layout for mobile in frontend/src/App.tsx
- [ ] T116 Add loading states to all API calls across components
- [ ] T117 Implement request debouncing for rapid user actions in frontend/src/hooks/
- [ ] T118 Add structured logging to all backend services in backend/app/services/
- [ ] T119 Run quickstart.md validation checklist
- [ ] T120 Create production docker-compose.prod.yml

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────►
                                                          │
Phase 2: Foundational ────────────────────────────────────►
                                                          │
                                                          ▼
              ┌─────────────────────────────────────────────┐
              │  User Stories can proceed in parallel:      │
              │                                             │
              │  Phase 3: US1 (Auth + Calendar) ──────►     │
              │                      │                      │
              │  Phase 4: US2 (Geocoding + Map) ◄───┘       │
              │                      │                      │
              │  Phase 5: US3 (Stops + Routes) ◄───┘        │
              │                      │                      │
              │  Phase 6: US4 (Itinerary Gen) ◄────┘        │
              │                      │                      │
              │  Phase 7: US5 (GPS Tracking) ◄─────┘        │
              │                      │                      │
              │  Phase 8: US6 (Stay Detection) ◄───┘        │
              └─────────────────────────────────────────────┘
                                                          │
Phase 9: Polish ◄─────────────────────────────────────────┘
```

### User Story Dependencies

| Story | Depends On | Can Run In Parallel With |
|-------|------------|--------------------------|
| US1 | Phase 2 (Foundational) | - |
| US2 | US1 (needs User model, auth) | - |
| US3 | US2 (needs maps_service, PlaceCache) | - |
| US4 | US3 (needs DayPlan, Stop, Leg models) | - |
| US5 | US1 (needs User model, auth) | US2, US3, US4 |
| US6 | US5 (needs Trace models) | - |

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# All these can run in parallel:
T002 (Python init) | T003 (React init) | T004 (Docker) | T005 (.env) | T006 (ruff) | T007 (ESLint)
```

**Phase 2 (Foundational)**:
```bash
# Backend parallel:
T013 (CORS) | T014 (Router) | T015 (Errors) | T016 (Redis)

# Frontend parallel:
T018 (TanStack) | T019 (API) | T020 (Auth Store) | T021 (Types) | T022 (Maps Provider)
```

**Within User Stories** (example US3):
```bash
# Models can be created in parallel:
T052 (DayPlan model) | T053 (Stop model) | T054 (Leg model)

# Frontend components can be created in parallel:
T061 (PlaceAutocomplete) | T062 (StopList) | T063 (StopCard) | T064 (TransportSelector) | T065 (RoutePolyline)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Auth + Calendar)
4. **STOP and VALIDATE**: Can users login and see calendar events?
5. Deploy/demo if ready

### Recommended Delivery Order

| Milestone | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 | Users can login and see calendar |
| Alpha | US1 + US2 | Events appear on map |
| Beta | US1-US4 | Full planning workflow |
| V1.0 | US1-US6 | Planning + tracking complete |

### Task Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Setup | 8 | 6 |
| Foundational | 14 | 10 |
| US1 | 17 | 4 |
| US2 | 11 | 4 |
| US3 | 18 | 8 |
| US4 | 10 | 2 |
| US5 | 19 | 8 |
| US6 | 12 | 4 |
| Polish | 10 | 5 |
| **Total** | **119** | **51** |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US#] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Frontend tasks assume @vis.gl/react-google-maps for map components
- Backend tasks assume GeoAlchemy2 for PostGIS integration
