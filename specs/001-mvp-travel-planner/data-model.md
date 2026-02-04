# Data Model: Mimi Journey MVP

**Feature**: 001-mvp-travel-planner
**Date**: 2026-02-04
**Database**: PostgreSQL 15+ with PostGIS 3.3+

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│   DayPlan   │───────│    Stop     │
└─────────────┘   1:N └─────────────┘   1:N └─────────────┘
      │                      │                     │
      │                      │                     │
      │               ┌──────┴──────┐              │
      │               │             │              │
      │          ┌────▼────┐  ┌─────▼─────┐  ┌─────▼─────┐
      │          │   Leg   │  │   Trace   │  │PlaceCache │
      │          └─────────┘  └─────┬─────┘  └───────────┘
      │                             │
      │                    ┌────────┴────────┐
      │                    │                 │
      │              ┌─────▼──────┐  ┌───────▼───────┐
      │              │TracePoint  │  │ TraceSegment  │
      │              └────────────┘  └───────────────┘
      │                    │
      │              ┌─────▼──────┐
      └──────────────│ StayPoint  │
                     └────────────┘
```

---

## Core Entities

### User

使用者帳號資訊與 OAuth Token 管理。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| google_id | VARCHAR(255) | UNIQUE, NOT NULL | Google 帳號 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 電子郵件 |
| name | VARCHAR(255) | NOT NULL | 顯示名稱 |
| picture_url | VARCHAR(512) | NULLABLE | 頭像 URL |
| refresh_token | TEXT | ENCRYPTED, NULLABLE | OAuth Refresh Token |
| token_expires_at | TIMESTAMP | NULLABLE | Access Token 過期時間 |
| preferences | JSONB | DEFAULT '{}' | 用戶偏好設定 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |
| updated_at | TIMESTAMP | NOT NULL | 更新時間 |

**Indexes**:
- `idx_user_google_id` on `google_id`
- `idx_user_email` on `email`

---

### DayPlan

單日行程計畫。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| user_id | UUID | FK → User, NOT NULL | 所屬用戶 |
| plan_date | DATE | NOT NULL | 行程日期 |
| title | VARCHAR(255) | NULLABLE | 行程標題 |
| status | ENUM | NOT NULL, DEFAULT 'draft' | draft / confirmed / completed |
| default_transport | ENUM | NOT NULL, DEFAULT 'driving' | 預設交通方式 |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'Asia/Taipei' | 時區 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |
| updated_at | TIMESTAMP | NOT NULL | 更新時間 |

**Enums**:
- `plan_status`: draft, confirmed, completed
- `transport_mode`: walking, driving, transit, bicycling

**Indexes**:
- `idx_dayplan_user_date` on `(user_id, plan_date)` UNIQUE
- `idx_dayplan_status` on `status`

---

### Stop

行程中的停靠點。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| day_plan_id | UUID | FK → DayPlan, NOT NULL | 所屬行程 |
| sequence | INTEGER | NOT NULL | 順序（從 1 開始）|
| name | VARCHAR(255) | NOT NULL | 地點名稱 |
| address | VARCHAR(512) | NULLABLE | 完整地址 |
| geom | GEOMETRY(Point, 4326) | NOT NULL | 地理座標 |
| place_id | VARCHAR(255) | NULLABLE | Google Place ID |
| stop_type | ENUM | NOT NULL | 停靠點類型 |
| source | ENUM | NOT NULL | 資料來源 |
| scheduled_arrival | TIMESTAMP | NULLABLE | 預計抵達時間 |
| scheduled_departure | TIMESTAMP | NULLABLE | 預計離開時間 |
| stay_duration_minutes | INTEGER | DEFAULT 0 | 預計停留分鐘 |
| notes | TEXT | NULLABLE | 備註 |
| calendar_event_id | VARCHAR(255) | NULLABLE | Google Calendar Event ID |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |
| updated_at | TIMESTAMP | NOT NULL | 更新時間 |

**Enums**:
- `stop_type`: origin, destination, waypoint, rest_stop
- `stop_source`: calendar, manual, detected

**Indexes**:
- `idx_stop_dayplan_seq` on `(day_plan_id, sequence)` UNIQUE
- `idx_stop_geom` GIST on `geom`
- `idx_stop_place_id` on `place_id`

---

### Leg

連接兩個停靠點的路線段。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| day_plan_id | UUID | FK → DayPlan, NOT NULL | 所屬行程 |
| from_stop_id | UUID | FK → Stop, NOT NULL | 起點 |
| to_stop_id | UUID | FK → Stop, NOT NULL | 終點 |
| sequence | INTEGER | NOT NULL | 路段順序 |
| transport_mode | ENUM | NOT NULL | 交通方式 |
| distance_meters | INTEGER | NOT NULL | 距離（公尺）|
| duration_seconds | INTEGER | NOT NULL | 預估時間（秒）|
| polyline | TEXT | NOT NULL | Encoded Polyline |
| route_geom | GEOMETRY(LineString, 4326) | NULLABLE | 路線幾何 |
| directions_json | JSONB | NULLABLE | Google Directions 原始回應 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |

**Indexes**:
- `idx_leg_dayplan_seq` on `(day_plan_id, sequence)` UNIQUE
- `idx_leg_route_geom` GIST on `route_geom`

---

### Trace

軌跡追蹤 Session。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| user_id | UUID | FK → User, NOT NULL | 所屬用戶 |
| day_plan_id | UUID | FK → DayPlan, NULLABLE | 關聯行程（可選）|
| started_at | TIMESTAMP | NOT NULL | 開始時間 |
| ended_at | TIMESTAMP | NULLABLE | 結束時間 |
| status | ENUM | NOT NULL, DEFAULT 'active' | 狀態 |
| total_distance_meters | INTEGER | DEFAULT 0 | 總距離 |
| total_duration_seconds | INTEGER | DEFAULT 0 | 總時間 |
| point_count | INTEGER | DEFAULT 0 | 軌跡點數量 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |
| updated_at | TIMESTAMP | NOT NULL | 更新時間 |

**Enums**:
- `trace_status`: active, paused, completed

**Indexes**:
- `idx_trace_user_date` on `(user_id, started_at)`
- `idx_trace_status` on `status`

---

### TracePoint

原始 GPS 軌跡點。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGSERIAL | PK | 主鍵（高頻寫入用 SERIAL）|
| trace_id | UUID | FK → Trace, NOT NULL | 所屬軌跡 |
| geom | GEOMETRY(Point, 4326) | NOT NULL | 地理座標 |
| recorded_at | TIMESTAMP | NOT NULL | 記錄時間 |
| accuracy | FLOAT | NULLABLE | 精度（公尺）|
| altitude | FLOAT | NULLABLE | 海拔（公尺）|
| speed | FLOAT | NULLABLE | 速度（m/s）|
| heading | FLOAT | NULLABLE | 方向（0-360）|
| synced | BOOLEAN | NOT NULL, DEFAULT false | 已同步至後端 |

**Indexes**:
- `idx_tracepoint_trace_time` on `(trace_id, recorded_at)`
- `idx_tracepoint_geom` GIST on `geom`

**Partitioning** (建議):
- 按 `recorded_at` 月份分區，便於資料清理

---

### TraceSegment

簡化後的軌跡段（用於顯示）。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| trace_id | UUID | FK → Trace, NOT NULL | 所屬軌跡 |
| segment_index | INTEGER | NOT NULL | 段落索引 |
| geom | GEOMETRY(LineString, 4326) | NOT NULL | 簡化後的路線 |
| start_time | TIMESTAMP | NOT NULL | 開始時間 |
| end_time | TIMESTAMP | NOT NULL | 結束時間 |
| distance_meters | INTEGER | NOT NULL | 距離 |
| point_count_original | INTEGER | NOT NULL | 原始點數 |
| point_count_simplified | INTEGER | NOT NULL | 簡化後點數 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |

**Indexes**:
- `idx_tracesegment_trace` on `(trace_id, segment_index)` UNIQUE
- `idx_tracesegment_geom` GIST on `geom`

---

### StayPoint

偵測到的停留點。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| trace_id | UUID | FK → Trace, NOT NULL | 所屬軌跡 |
| user_id | UUID | FK → User, NOT NULL | 所屬用戶 |
| geom | GEOMETRY(Point, 4326) | NOT NULL | 中心點座標 |
| arrived_at | TIMESTAMP | NOT NULL | 抵達時間 |
| departed_at | TIMESTAMP | NULLABLE | 離開時間 |
| duration_minutes | INTEGER | NOT NULL | 停留時長 |
| radius_meters | FLOAT | NOT NULL | 活動半徑 |
| point_count | INTEGER | NOT NULL | 包含的軌跡點數 |
| status | ENUM | NOT NULL, DEFAULT 'detected' | 狀態 |
| matched_stop_id | UUID | FK → Stop, NULLABLE | 匹配的停靠點 |
| place_name | VARCHAR(255) | NULLABLE | 反向地理編碼名稱 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |

**Enums**:
- `staypoint_status`: detected, confirmed, ignored

**Indexes**:
- `idx_staypoint_trace` on `trace_id`
- `idx_staypoint_geom` GIST on `geom`
- `idx_staypoint_user_time` on `(user_id, arrived_at)`

---

### PlaceCache

地理編碼快取。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 主鍵 |
| place_id | VARCHAR(255) | UNIQUE, NOT NULL | Google Place ID |
| name | VARCHAR(255) | NOT NULL | 地點名稱 |
| address | VARCHAR(512) | NOT NULL | 完整地址 |
| geom | GEOMETRY(Point, 4326) | NOT NULL | 座標 |
| types | VARCHAR[] | NULLABLE | 地點類型 |
| raw_response | JSONB | NULLABLE | 原始 API 回應 |
| created_at | TIMESTAMP | NOT NULL | 建立時間 |
| expires_at | TIMESTAMP | NOT NULL | 過期時間（預設 30 天）|

**Indexes**:
- `idx_placecache_place_id` on `place_id`
- `idx_placecache_geom` GIST on `geom`
- `idx_placecache_expires` on `expires_at`

---

## State Transitions

### DayPlan Status

```
draft ──────► confirmed ──────► completed
  │               │
  │               ▼
  └─────────► (deleted)
```

### Trace Status

```
active ◄────► paused ──────► completed
   │                            │
   └────────────────────────────┘
          (auto-complete after timeout)
```

### StayPoint Status

```
detected ──────► confirmed
    │                │
    └──► ignored ◄───┘
```

---

## Validation Rules

### User
- `email` 必須是有效 email 格式
- `google_id` 必須是非空字串

### DayPlan
- `plan_date` 不能早於今天減 365 天
- 同一用戶同一天只能有一個 DayPlan

### Stop
- `sequence` 必須 >= 1
- 同一 DayPlan 內 `sequence` 不可重複
- `stay_duration_minutes` 必須 >= 0

### TracePoint
- `accuracy` 若提供必須 > 0
- `speed` 若提供必須 >= 0
- `heading` 若提供必須在 0-360 之間

### StayPoint
- `duration_minutes` 必須 >= 5（最小停留偵測門檻）
- `radius_meters` 必須 > 0

---

## Sample SQL

### 建立 PostGIS 擴展

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 建立 Enum Types

```sql
CREATE TYPE plan_status AS ENUM ('draft', 'confirmed', 'completed');
CREATE TYPE transport_mode AS ENUM ('walking', 'driving', 'transit', 'bicycling');
CREATE TYPE stop_type AS ENUM ('origin', 'destination', 'waypoint', 'rest_stop');
CREATE TYPE stop_source AS ENUM ('calendar', 'manual', 'detected');
CREATE TYPE trace_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE staypoint_status AS ENUM ('detected', 'confirmed', 'ignored');
```

### 建立 User Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(512),
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_google_id ON users(google_id);
CREATE INDEX idx_user_email ON users(email);
```

### 建立 TracePoint Table (with Spatial Index)

```sql
CREATE TABLE trace_points (
    id BIGSERIAL PRIMARY KEY,
    trace_id UUID NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    accuracy FLOAT,
    altitude FLOAT,
    speed FLOAT,
    heading FLOAT,
    synced BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_tracepoint_trace_time ON trace_points(trace_id, recorded_at);
CREATE INDEX idx_tracepoint_geom ON trace_points USING GIST(geom);
```
