# 10-1. 메인 지도 페이지 (`/`)

## 1. 개요

| 항목      | 값                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------- |
| 페이지 ID | `screen-map`                                                                                   |
| 라우트    | `/`                                                                                            |
| 파일      | `app/pages/index.vue`                                                                          |
| SSR       | `false` (Cesium 의존)                                                                          |
| 목적      | Cesium 3D 지도 위에서 러닝 경로를 그리고, 저장하고, 다른 사용자 경로를 탐색하는 메인 작업 화면 |

## 2. 진입 경로

- 도메인 루트 직접 진입 (`https://{host}/`)
- `/settings`, `/admin`, `/share/[routeId]` 의 "홈으로" / "지도로 이동" 액션
- 공유 링크에서 "홈으로" 버튼

## 3. 화면 레이아웃

<!-- TODO(image): docs/wiki/images/screen-map-overview.png — 전체 와이어프레임 (좌측바 + 지도 + 우측 SlideOver + 하단 footer + 칩 오버레이) -->

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                    ┌──────┐│
│  │ Side │                                                    │Slide ││
│  │ bar  │                                                    │Over  ││
│  │ (좌) │             Cesium 3D Map Canvas                  │(우)  ││
│  │      │     · 행정구역 boundary                            │      ││
│  │ - 그리기                                                  │ 경로 ││
│  │ - 탐색│   · 편의시설 facility entities                    │ 카드 ││
│  │ - 인증│   · 그려진 sections 폴리라인                      │ 목록 ││
│  │ - 설정│   · 경로 marker (route-info)                      │      ││
│  │      │                                                    │ 인증 ││
│  │      │   [chip 8방향 — plugin chip slot]                  │ 모달 ││
│  │      │                                                    │ etc. ││
│  │      │                                                    │      ││
│  └──────┘                                                    └──────┘│
│  [Floating Action Menu — 그리기/저장/비교/경로정보 등 chip toggles] │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Map Footer — 거리/시간/구간 요약 + 경사도 토글 + elevationChart││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

- **상단 영역** — Cesium viewer 가 전체 viewport 를 차지
- **좌측 MapSidebar** — 페이지 탭(그리기 / 탐색 / 인증 / 설정 진입)
- **우측 SlideOver** — `useSlideOverNav(activeNav)` 로 활성 nav 에 따라 컨텐츠 스위치 (`SlideOverContent`)
- **상단 오버레이 (chip)** — 플러그인 chip 8방향 슬롯 (sidewalk 등). manifest 의 `position` 으로 배치
- **하단 FloatingActionMenu** — `useFabGroups`. 그리기/저장/비교/경로정보 등 컨텍스트별 칩 노출 (`useOverlayContext`)
- **하단 Map Footer** — 거리·시간·구간 요약 + 경사도 토글 + 고도 차트(elevationChart)
- **모달 레이어** — `RouteSaveModal`, `RouteCompareModal`, `showDrawingHelpModal`

## 4. 컴포넌트 구성

| 컴포넌트                                          | 역할                                        |
| ------------------------------------------------- | ------------------------------------------- |
| `widgets/map-shell/ui/MapShell.vue`               | Cesium viewer 마운트 + viewer ref 제공      |
| `widgets/map-shell/ui/MapSidebar.vue`             | 좌측 nav 탭                                 |
| `widgets/map-shell/ui/MapFooter.vue`              | 하단 거리·구간·고도 차트                    |
| `widgets/map-shell/ui/MapOverlays.vue`            | chip 슬롯 호스트 — `PluginChipLayer` 마운트 |
| `widgets/map-shell/ui/SlideOverContent.vue`       | 우측 SlideOver 본문 — nav 별 컨텐츠 분기    |
| `shared/ui/FloatingActionMenu.vue`                | 컨텍스트 의존 액션 칩 그룹                  |
| `features/draw-route/ui/RouteSaveModal.vue`       | 저장 모달 (제목·설명·공개 여부 + GPX)       |
| `features/route-compare/ui/RouteCompareModal.vue` | 두 경로 비교 모달                           |
| `plugins-ext/PluginSurfaceHost.vue`               | sidepanel/dashboard/popup 표면 슬롯 호스트  |
| `plugins-ext/PluginLauncher.vue`                  | sidepanel 등 표면 열기 트리거               |

## 5. 인터랙션

### 5-1. 경로 그리기 → 저장

1. FAB → "그리기" 칩 활성 → `useRouteDrawStore.drawing = true`
2. 지도 클릭마다 section vertex 추가, 경로 polyline 실시간 렌더
3. FAB → "저장" → 비로그인이면 AuthModal 자동 표출 (#5)
4. `RouteSaveModal` 입력 → `POST /api/routes` → 성공 시 `routeInfoEffect.saveLocalRouteInfos(routeId)` 로 등록한 메모도 영속

### 5-2. 경로 정보 (지도 마커 메모)

1. 경로 선택 후 FAB → "경로정보" 칩 (`useOverlayContext.showRouteInfoChip`)
2. 지도 위치 클릭 → 이름·설명 입력 (최대 500자)
3. 등록 시 핀 마커 생성, 마커 클릭 시 팝업 표시

### 5-3. 경로 비교

1. FAB → "비교" → `RouteCompareModal`
2. 좌·우 경로 선택 → `useRouteCompareSideeffect` 가 두 경로 동시 렌더 + 메트릭 표

### 5-4. 경로 공유

1. 경로 카드 / 상세 → "공유" → URL 복사 (`/share/{routeId}`)
2. 인증 없이 누구나 접근 가능 (§10-4)

### 5-5. 플러그인 — 탐색 (sidepanel)

1. PluginLauncher 의 "탐색" 클릭 → sidepanel 열림
2. 서울 25개 구 칩 중 하나 클릭 → 카메라 8000m 로 1.5초 이동 + 공개 경로 목록 조회
3. 정렬: 거리 / 고도 / 최신 / 인기
4. 카드 클릭 → 지도에 미리보기 (선택 route ID 는 `useExploreSearchSideeffect` 의 store 에 보관, 코어가 오버레이 컨텍스트 판단에 사용)
5. 같은 구 다시 클릭 → 선택 해제

### 5-6. 플러그인 — 인도 (chip)

1. chip 슬롯의 "인도" 칩 토글
2. `app/plugins-ext/sidewalk` 가 `useMapViewer` 로 viewer 잡아 GeoJSON 오버레이 렌더 / 클린업

### 5-7. 경사도 / 고도

- 경사도: footer 의 "경사도" 칩 → 구간별 색상 폴리라인 (초록↔빨강) + 난이도 뱃지 (초급/중급/고급/전문가)
- 고도: 경로 선택/작성 시 footer elevationChart 자동 렌더

## 6. 데이터 / API

| 의존                                                                                                   | 형태                                                           |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `GET /api/routes`                                                                                      | 경로 목록 (탐색 / 좌측 목록)                                   |
| `POST/PUT/DELETE /api/routes`                                                                          | 저장 / 수정 / 삭제 (#6 — 소유자 검증)                          |
| `GET /api/routes/share/{routeId}`                                                                      | 공유용 페이로드 (코어에서는 사용 X, 공유 페이지 전용)          |
| `GET /api/boundary/seoul`, `seoul-dong`                                                                | 행정구역 GeoJSON (서버가 `southkorea/seoul-maps` proxy + 캐싱) |
| `GET /api/me/feature-prefs`                                                                            | 플러그인 활성 상태 — `PluginSlot` 이 필터링에 사용             |
| `useRouteDrawStore`, `useRouteInfoStore`, `useNotificationStore`, `useAuthStore`                       | Pinia/useState 기반 클라이언트 store                           |
| `useRouteMapFacade`, `useMapFeatureInit`, `useRouteSelectionFlow`, `useOverlayContext`, `useFabGroups` | facade composable (책임 분리)                                  |
| `useMapViewer`, `useMapActions`                                                                        | 플러그인 DI 토대                                               |

## 7. 권한 / 비로그인 동작

| 액션                             | 비로그인 동작                                           |
| -------------------------------- | ------------------------------------------------------- |
| 지도 보기, 그리기                | 허용 (로컬 상태)                                        |
| 저장 (`POST /api/routes`)        | AuthModal 자동 표시 (#5)                                |
| 본인 경로 수정/삭제              | 로그인 + 소유자 일치 필수 (서버 검증)                   |
| 플러그인 토글 (sidewalk/explore) | 비로그인 시 `defaultEnabled` 만 적용 (개인 pref 미저장) |

## 8. 관련 코드

- 페이지 진입: `app/pages/index.vue`
- 셸: `app/widgets/map-shell/ui/*`, `app/widgets/map-shell/model/*`
- 그리기: `app/features/draw-route/**`
- 비교: `app/features/route-compare/**`
- 경로정보: `app/features/route-info/**`, `app/entities/route/model/useRouteInfoStore.ts`
- 카메라: `app/features/camera/api/useCameraSideeffect.ts`
- 행정구역: `app/entities/boundary/**`, `server/utils/district/boundary.ts`, `server/api/boundary/*.get.ts`
- 편의시설: `app/widgets/facility-overlay/**`, `app/entities/facility/**`, `server/data/facilities/*.json`
- 플러그인 호스트: `app/plugins-ext/PluginSlot.vue`, `PluginSurfaceHost.vue`, `PluginLauncher.vue`, `registry.ts`
- DI: `app/shared/lib/map/useMapViewer.ts`, `useMapActions.ts`

## 9. 관련 PR / 이슈

- 셸 facade 분리 — 챕터 5 (Frontend) 참조
- 플러그인 토대 / chip 8방향 / surface 슬롯 / 인도 / 탐색 — PR #352, #354, #356, #358, #361, #363, #365, #367 (epic #350)
- 경로 권한 검증 — #6
- 로그인 유도 UX — #5
- 탐색 미리보기 — #3
