# Full Spec Review Checklist: Mimi Journey MVP

**Purpose**: Self-review of requirements quality across all 6 user stories - validating completeness, clarity, consistency, and coverage
**Created**: 2026-02-08
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)

**Depth**: Standard | **Audience**: Author (self-review) | **Focus**: All user stories, all quality dimensions

---

## Requirement Completeness

- [ ] CHK001 - Are error/failure requirements defined for Google OAuth login failures (network error, user denies consent, invalid state)? [Gap, Spec §US1]
- [ ] CHK002 - Are requirements specified for what happens when Google Calendar API returns rate-limit errors or is unavailable? [Gap, Spec §US1]
- [ ] CHK003 - Are loading state requirements defined for calendar event fetching, geocoding, and route calculation? [Gap]
- [ ] CHK004 - Are requirements documented for the "empty state" when a user has no stops and no calendar events on a given day? [Completeness, Spec §US1-AS3]
- [ ] CHK005 - Are data retention and deletion requirements specified for user data, traces, and cached places? [Gap]
- [ ] CHK006 - Is the behavior specified when the user logs out mid-tracking (GPS trace in progress)? [Gap, Spec §US5]
- [ ] CHK007 - Are requirements defined for how calendar events without a location field are handled in the geocoding pipeline? [Completeness, Spec §US2-AS3]
- [ ] CHK008 - Are requirements specified for maximum number of stops per DayPlan and system behavior when limit is reached? [Gap, Spec §US3]

## Requirement Clarity

- [ ] CHK009 - Is "每 10 秒（或每移動一定距離）" quantified with specific distance thresholds for all movement states? [Clarity, Spec §US5-AS2] (Note: research.md defines 10m/25m/50m thresholds but spec.md uses vague language)
- [ ] CHK010 - Is "系統計算最佳路線順序" defined with a specific optimization algorithm or criteria (shortest time? shortest distance? respect time constraints)? [Ambiguity, Spec §US4-AS1]
- [ ] CHK011 - Is "建議的緩衝時間" quantified with specific buffer calculation rules (fixed? percentage of travel time?)? [Ambiguity, Spec §US4-AS2]
- [ ] CHK012 - Is "地點待確認" behavior fully specified - where it appears, how the user resolves it, and what happens if left unresolved? [Clarity, Spec §US2-AS3]
- [ ] CHK013 - Is "95% 的有效地址能成功轉換" (SC-002) defined with what constitutes a "valid address"? [Ambiguity, Spec §SC-002]
- [ ] CHK014 - Is "停留點偵測準確率達到 80%" (SC-006) defined with how accuracy is measured (precision? recall? F1?)? [Ambiguity, Spec §SC-006]
- [ ] CHK015 - Is "支援同時處理至少 100 位使用者" (SC-007) specified with concurrent load profile (peak vs sustained, request types)? [Clarity, Spec §SC-007]

## Requirement Consistency

- [ ] CHK016 - Are GPS recording interval requirements consistent between spec.md ("每 10 秒") and research.md (dynamic 5s/10s/30s by speed)? [Conflict, Spec §US5 vs Research §2]
- [ ] CHK017 - Are the DayPlan status transitions in spec.md ("草稿/已確認") consistent with data-model.md (draft/confirmed/completed + deleted)? [Conflict, Spec §Key Entities vs data-model.md §State Transitions]
- [ ] CHK018 - Are stop types in spec.md ("事件/手動/休息點") consistent with data-model.md enum (origin/destination/waypoint/rest_stop)? [Conflict, Spec §Key Entities vs data-model.md §Stop]
- [ ] CHK019 - Are the transport mode options in spec FR-007 (4 modes) consistent with the Directions API limitation that transit mode doesn't support multi-stop routing? [Conflict, Spec §FR-007 vs Research §4]
- [ ] CHK020 - Is the WebSocket requirement in research.md (every 500ms batch update) consistent with the spec's 10-second recording interval? [Consistency, Research §4 vs Spec §US5]

## Acceptance Criteria Quality

- [ ] CHK021 - Are acceptance scenarios for US3-AS4 (drag reorder) measurable - what does "重新計算路線和時間並更新顯示" look like in terms of response time? [Measurability, Spec §US3-AS4]
- [ ] CHK022 - Is SC-001 ("30 秒內完成 Google 登入") measurable end-to-end including Google's own auth page load time (which is external)? [Measurability, Spec §SC-001]
- [ ] CHK023 - Are acceptance criteria defined for when itinerary generation fails or produces a suboptimal result? [Gap, Spec §US4]
- [ ] CHK024 - Is there an acceptance scenario for US5 covering the transition from "tracking active" to "app goes to background" (PWA limitation)? [Gap, Spec §US5]

## Scenario Coverage

- [ ] CHK025 - Are requirements defined for handling concurrent DayPlan edits from multiple browser tabs/devices? [Coverage, Gap]
- [ ] CHK026 - Are timezone handling requirements specified for users traveling across timezones during a day plan? [Coverage, Gap] (Note: data-model defaults to Asia/Taipei)
- [ ] CHK027 - Are requirements defined for the user flow when Google Calendar permissions are revoked after initial login? [Coverage, Spec §Edge Cases]
- [ ] CHK028 - Are requirements specified for batch geocoding behavior when multiple calendar events have the same location text? [Coverage, Spec §US2]
- [ ] CHK029 - Are requirements defined for what happens when a user starts tracking without an existing DayPlan for the day? [Coverage, Spec §US5-AS1] (Spec says "已登入且有當天行程" but Trace model allows nullable day_plan_id)

## Edge Case Coverage

- [ ] CHK030 - Are requirements defined for Google API quota exhaustion mid-session (e.g., during route calculation for a multi-stop plan)? [Edge Case, Gap]
- [ ] CHK031 - Are offline-to-online transition requirements specified beyond GPS tracking (e.g., what about geocoding, route preview)? [Edge Case, Spec §Edge Cases]
- [ ] CHK032 - Is the behavior specified when Douglas-Peucker simplification produces a degenerate segment (fewer than 2 points)? [Edge Case, Gap]
- [ ] CHK033 - Are requirements defined for handling GPS coordinates that fall outside the expected geographic region? [Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK034 - Are accessibility requirements specified for the map interface (keyboard navigation, screen reader support for markers/routes)? [Gap]
- [ ] CHK035 - Are mobile responsiveness requirements defined with specific breakpoints or minimum supported screen sizes? [Gap]
- [ ] CHK036 - Are browser compatibility requirements specified beyond "desktop/mobile browsers"? [Gap, Plan §Technical Context]
- [ ] CHK037 - Is the PlaceCache TTL (30 days in data-model.md) documented as a requirement with rationale, or only as an implementation detail? [Traceability, data-model.md §PlaceCache]

## Dependencies & Assumptions

- [ ] CHK038 - Is the assumption "使用者的行事曆事件有填寫地點資訊" quantified with expected percentage, and are requirements defined for the partial-data scenario? [Assumption, Spec §Assumptions]
- [ ] CHK039 - Are Google Maps API cost implications documented as a constraint, with requirements for cost-control mechanisms beyond caching? [Dependency, Gap]
- [ ] CHK040 - Is the Redis dependency documented with failover requirements (what happens if Redis is unavailable)? [Dependency, Gap]

## Notes

- Check items off as completed: `[x]`
- Add inline comments with findings or decisions
- Items referencing [Gap] indicate requirements that may need to be added to spec.md
- Items referencing [Conflict] indicate inconsistencies between documents that need resolution
- Items referencing [Ambiguity] indicate vague language that needs quantification
