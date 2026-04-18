# 경사도 UI 개선 + 최적화 구간 분할 수정 + HoverTooltip 모듈화

---

## 1. HoverTooltip 재��용 컴포넌트

**파일**: `app/components/map/atoms/HoverTooltip.vue`

hover 시 tooltip을 표시하는 범용 래퍼 컴포넌트. `#trigger` / `#content` 슬롯 기반.

- `placement`: `top` | `bottom` | `left` | `right` (기본 `top`)
- `offset`: trigger와 tooltip 사이 간격 px (���본 8)
- CSS 변수 기반 위치 계산, `pointer-events: none`으로 마우스 방해 없음

## 2. 난이도 뱃지 tooltip

**파일**: `app/components/map/molecules/GradientToggle.vue`

- 난이도 뱃지를 `HoverTooltip`으로 감싸 hover 시 판정 기준 테이블 표시
- 거리 / 상승고도 / 최대경사 3가지 기준과 4단계 등급 표시

## 3. 최적화 후 section 분할 수정

**파일**: `app/composables/action/useRouteDrawDraft.ts`, `app/composables/useRouteMapFacade.ts`

### 문제
TMap/OSM 경로 최적화 후 `createInitialSectionPointRanges(positions.length)`가 API 반환 전체 포인트 수로 section을 생성. 사용자가 4곳 클릭 → 200개 포인트 → 199개 section.

### 수정
- `createWaypointBasedSectionRanges(optimizedPositions, originalWaypoints)` 추가
- 최적화 전 `originalWaypoints`를 보존하고, 최적화된 결과에서 원본 waypoint의 위치를 순방향 탐색으로 찾아 section 경계 생성
- 사용자가 4곳 클릭 → 3개 section (원본 waypoint 기준)

## 4. CLAUDE.md 규칙 추가

- 폴리라인 겹침 처리: `entity.show` 토글 방식
- 최적화 후 section 분할: `createWaypointBasedSectionRanges` 사용
- 공유 상태: `ref()` 대신 `useState()` 사용 규칙
- `HoverTooltip` 사용 규칙
- atoms 계층 역할 정의
