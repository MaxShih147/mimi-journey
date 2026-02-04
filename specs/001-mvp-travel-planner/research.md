# Research Summary: Mimi Journey MVP

**Feature**: 001-mvp-travel-planner
**Date**: 2026-02-04
**Status**: Complete

## Overview

本文件整合了 MVP 開發所需的技術研究結果，涵蓋四個主要領域：

1. Google OAuth 2.0 與行事曆整合
2. GPS 軌跡追蹤（PWA）
3. PostGIS 空間資料處理
4. Google Maps API 與 React 整合

---

## 1. Google OAuth 2.0 認證

### Decision: Backend-for-Frontend (BFF) 架構

**Rationale**:
- Access Token 存於後端記憶體（FastAPI），不暴露給前端
- Refresh Token 使用 HttpOnly Secure SameSite=Strict Cookie
- 符合 IETF 對 SPA 的安全建議
- Auth0、Google、Okta 皆推薦此模式

**Alternatives Considered**:
| 方案 | 優點 | 缺點 | 決定 |
|------|------|------|------|
| 純前端 Token 管理 | 簡單 | XSS 風險高、Token 暴露 | 否決 |
| Session-based Auth | 傳統可靠 | 擴展性差 | 否決 |
| BFF Pattern | 安全、可擴展 | 稍複雜 | **採用** |

### Key Implementation Details

**PKCE Flow（強制）**:
```
1. React 生成 code_verifier (128 chars random)
2. 計算 code_challenge = SHA256(code_verifier)
3. 重定向至 Google Auth 時帶上 code_challenge
4. 後端用 code_verifier 交換 token
```

**Google Calendar API Scope**:
```
https://www.googleapis.com/auth/calendar.readonly
```
- 只需讀取權限（MVP 不寫回）
- 非敏感 scope，無需額外審核

**Token 管理策略**:
- Access Token: 15-30 分鐘過期，後端記憶體/Redis 快取
- Refresh Token: 7-14 天，HttpOnly Cookie
- 主動刷新：Access Token 過期前 5 分鐘自動更新

---

## 2. GPS 軌跡追蹤（PWA）

### Decision: 前景追蹤 + 混合記錄策略

**Rationale**:
- PWA 無法背景追蹤（瀏覽器限制）
- 採用距離+時間雙門檻，平衡精度與電量
- IndexedDB 離線緩衝，網路恢復後批次上傳

**Recording Strategy**:
```
記錄條件：距離 >= 10m OR 時間 >= 10s
預估：~360 點/小時，電量消耗 4-6%/小時
```

**Dynamic Adjustment by Speed**:
| 移動狀態 | 速度 | 距離門檻 | 時間門檻 |
|----------|------|----------|----------|
| 快速移動 | >15 m/s | 25m | 5s |
| 一般移動 | 1-15 m/s | 10m | 10s |
| 靜止 | <1 m/s | 50m | 30s |

### Accuracy Filtering (3-Layer)

1. **閾值過濾**: accuracy > 50m 的點丟棄
2. **統計過濾**: 與最近 10 點平均距離 > 3σ 丟棄
3. **速度檢查**: 速度 > 83 m/s (300 km/h) 丟棄

### Offline Handling

- 使用 IndexedDB 儲存未同步的軌跡點
- 標記 `synced: boolean` 欄位
- 網路恢復時批次上傳，指數退避重試（1s, 2s, 4s...）

### PWA Limitations

- 無法背景追蹤（螢幕關閉後 geolocation 停止）
- 需顯示前景警告 banner
- 偵測 `visibilitychange` 事件暫停/恢復
- 未來升級：React Native/Cordova 原生 App

---

## 3. PostGIS 空間資料

### Decision: 混合儲存架構

**Rationale**:
- `trace_points`: 原始 GPS 點，支援即時查詢
- `trace_segments`: 簡化後的 LineString，顯示用
- 分離儲存優化不同查詢場景

**Data Model**:
```
trace_points: 原始點 (lat, lng, ts, accuracy, speed)
trace_segments: 簡化路徑 LineString + 統計
stay_points: 偵測到的停留點
```

### Stay Point Detection (DBSCAN)

```sql
SELECT ST_ClusterDBSCAN(geom, eps := 50, minpoints := 3)
       OVER() AS cluster_id
FROM trace_points
WHERE trace_id = :trace_id;
```

**Parameters**:
- `eps`: 50m（群集半徑）
- `minpoints`: 3（最小點數）
- 停留時間 >= 5 分鐘才算有效停留點

### Polyline Simplification

**Algorithm**: Douglas-Peucker
```python
from shapely.geometry import LineString

line = LineString([(p.lng, p.lat) for p in points])
simplified = line.simplify(tolerance=0.0005)  # ~50m
```

**Compression Result**: 50-90% 資料縮減，保持路徑形狀

### Spatial Index

```sql
CREATE INDEX idx_trace_points_geom
ON trace_points USING GIST(geom);
```

- 使用 `&&` 運算符先做 bounding box 過濾
- 再用 `ST_DWithin` 精確距離查詢

---

## 4. Google Maps API + React

### Decision: @vis.gl/react-google-maps

**Rationale**:
- Google 官方支持，vis.gl 團隊維護
- 12.4kb gzip，tree-shakeable
- React Hooks 優先設計
- `useMapsLibrary()` 動態載入 Geocoding/Routes

**Alternatives Considered**:
| 套件 | 維護狀態 | 效能 | 決定 |
|------|----------|------|------|
| @react-google-maps/api | 活躍 | 良好 | 備選 |
| google-maps-react | 較差 | Class-based | 否決 |
| @vis.gl/react-google-maps | 官方 | 最佳 | **採用** |

### Multi-Stop Routing

**Directions API 限制**:
- 基本方案：10 個中途點
- 進階方案：25 個中途點
- Transit 模式：不支援多點，僅單一起終點

**實作方式**:
```typescript
const request = {
  origin,
  destination,
  waypoints: stops.slice(1, -1).map(s => ({
    location: { lat: s.lat, lng: s.lng },
    stopover: true
  })),
  travelMode: google.maps.TravelMode.DRIVING,
  optimizeWaypoints: true  // 自動優化順序
};
```

### Real-Time Tracking

- 使用 WebSocket 每 500ms 批次更新位置
- 保留最近 1000 個軌跡點避免效能問題
- 拖曳地圖時暫停 marker 更新

### Marker Optimization

- 100+ markers: 必須使用 MarkerClusterer
- 500+ markers: 使用 raster image 取代 SVG
- 使用 `React.memo` + `useCallback` 避免重渲染

---

## Technology Stack Summary

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | React | 18.x | with TypeScript |
| Map Library | @vis.gl/react-google-maps | latest | Google-sponsored |
| Backend | FastAPI | 0.100+ | Python 3.11+ |
| Database | PostgreSQL + PostGIS | 15+ / 3.3+ | Spatial support |
| Cache | Redis | 7.x | Token & geocode cache |
| Auth | Google OAuth 2.0 | - | PKCE + BFF pattern |
| External APIs | Google Calendar, Maps | v3 | Geocoding, Directions, Places |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PWA 背景追蹤限制 | 確定 | 中 | 明確告知用戶、未來原生 App |
| Google API 配額超限 | 低 | 高 | 快取、請求限流 |
| Token 安全性問題 | 低 | 高 | BFF 架構、HttpOnly Cookie |
| GPS 精度不足 | 中 | 中 | 3-layer 過濾、Kalman filter (Phase 2) |

---

## References

詳細研究文件位於專案根目錄：

- `OAUTH2_*.md` - OAuth 認證相關（6 份文件）
- `GPS_TRACKING_*.md` - 軌跡追蹤相關（4 份文件）
- `POSTGIS_*.md` - PostGIS 相關（3 份文件）
- `IMPLEMENTATION_GUIDE.md` - 實作指南
- `SQL_PATTERNS.md` - SQL 查詢範例
