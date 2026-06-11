# 5. Frontend

Nuxt 4 + Vue 3 + Cesium 1.140 기반 SPA. `app/` 디렉터리, **FSD(Feature-Sliced Design)** 변형 적용.

## 5.1 디렉터리 구조

```
app/
├─ entities/             # 도메인 단위 (6종)
│  ├─ boundary/  facility/  gradient/
│  ├─ notification/  route/  user/
├─ features/             # 기능 단위 (11종)
│  ├─ base-map/  camera/  draw-route/  elevation-layer/
│  ├─ explore/  graphic-quality/  route-compare/  route-info/
│  ├─ route-social/  share-viewer/  view-mode/
├─ widgets/              # 화면 단위 (2종)
│  ├─ facility-overlay/  map-shell/
├─ shared/               # 공통
│  ├─ lib/               # composable utilities + map utilities
│  ├─ model/             # 공유 model
│  └─ ui/                # UI primitives (cards 등)
├─ pages/                # Nuxt 라우팅
├─ middleware/, plugins/, assets/
```

각 feature 는 `api/`(sideeffect) · `model/`(store·action) · `lib/`(순수 로직) · `ui/`(컴포넌트) 의 하위 디렉터리로 구성되며, 모든 디렉터리를 다 갖추지는 않습니다.

## 5.2 기능 단위 (Features)

11개 feature 는 모두 **Store(상태) → Sideeffect(부수효과) → UI** 의 단방향 흐름을 따릅니다.

| Feature           | 역할                               | 핵심 의존                    |
| ----------------- | ---------------------------------- | ---------------------------- |
| `base-map`        | 베이스맵(V-World WMTS) 전환        | Cesium `imageryLayers`       |
| `camera`          | 시점 모드 + 좌표·역지오코딩        | Cesium camera, 경계 GeoJSON  |
| `draw-route`      | 경로 그리기 (저장·분할·최적화)     | Cesium 지형, 드로잉 이벤트   |
| `elevation-layer` | 고도 색상화 + SVG 고도 프로필      | Cesium `globe.material`      |
| `explore`         | 공개 경로 검색/탐색·fork           | `/api/routes/search`         |
| `graphic-quality` | 렌더링 품질 자동/수동 조절         | FPS 측정(`postRender`)       |
| `route-compare`   | 두 경로 통계 비교                  | `/api/routes/compare`        |
| `route-info`      | 경로 피드백/정보 마커              | `ScreenSpaceEventHandler`    |
| `route-social`    | 공유 링크·좋아요 (낙관적 업데이트) | clipboard API, like 토글     |
| `share-viewer`    | 공유 페이지 (읽기 전용 렌더링)     | Cesium polyline              |
| `view-mode`       | 2D/3D 화면 모드 전환               | Cesium camera pitch, 3D 타일 |

> `draw-route` 가 가장 복잡하며 `useRoute*Sideeffect` 들로 그리기·저장·분할·최적화·다운로드 책임을 단일 책임 단위로 분리합니다.

## 5.3 Composables 패턴

`app/shared/lib/` 및 각 entity/feature 의 `lib/`, `model/` 디렉터리에 작성합니다.

| 유형            | 책임                                      | 예시                                              |
| --------------- | ----------------------------------------- | ------------------------------------------------- |
| **Action**      | 한 번에 끝나는 동작 (이벤트 → 부수효과)   | UI 클릭 핸들러                                    |
| **Side-effect** | Cesium Entity 추가/제거, 외부 시스템 호출 | `createToggleLayerSideeffect`, `useEntityCleanup` |
| **Store**       | 상태 보유 (`useState` 기반)               | 컬렉션 상태, 토글 상태                            |

`app/shared/lib/` 의 대표 컴포저블:

- `useWindow`, `useFormatUtils`, `useRouteInfoFormat`
- `usePlaybackStateMachine` (xstate 기반)
- `auth-gate`

## 5.4 Map (Cesium) 레이어

`app/shared/lib/map/` 에 Cesium 통합 유틸이 모여 있습니다.

| Util                          | 역할                               |
| ----------------------------- | ---------------------------------- |
| `useMapInit`                  | Cesium Viewer 초기화               |
| `useCesiumRuntime`            | 런타임 헬퍼                        |
| `useEntityCleanup`            | Entity 생명주기 (add/remove/clear) |
| `useTerrainSampler`           | 지형 고도 샘플링                   |
| `usePoiOverlay`               | POI 오버레이                       |
| `densifyPositions`            | 좌표 보간                          |
| `createToggleLayerSideeffect` | 레이어 토글 부수효과 팩토리        |

**Layer 추가 절차** — 스킬 `create-map-layer-sideeffect` 의 패턴 참고 (Entity 생명주기 + Options DI + Init/Destroy).

## 5.5 Overlay 가시성 동기화

**경로 컨텍스트에 따라 오버레이 UI 그룹의 표출·정리를 일괄 동기화**합니다.

- 핵심 enum — `shared/types/map-overlay-context.enum.ts`
- 패턴 — 스킬 `sync-overlay-visibility` 의 가이드 참고
- 사용처 — 카드가 사라지면 연관 칩/버튼도 같이 숨김

## 5.6 화면 단위 (Widgets)

| Widget             | 역할                                         |
| ------------------ | -------------------------------------------- |
| `map-shell`        | 메인 페이지 레이아웃 + Facade 오케스트레이션 |
| `facility-overlay` | 편의시설 종류별 토글 칩 + "현재 위치 검색"   |

`map-shell` 은 **Facade 패턴**으로 페이지가 `useRouteMapFacade` 하나만 import 하면 내부적으로 목록·드로잉·지형·고도·최적화 등 sub-facade 를 조합합니다. UI 는 `MapShell`/`MapSidebar`/`MapOverlays`/`MapFooter`/`SlideOverContent` 로 구성됩니다.

## 의존 흐름

```mermaid
flowchart LR
    Page[app/pages/*.vue] --> W[app/widgets/*]
    W --> F[app/features/*]
    F --> E[app/entities/*]
    E --> S[app/shared/*]
    F -.fetch.-> API[/api/*]
    E -.types.-> SH[shared/types + schemas]
```

## 관련 스킬

- `runnable-components` — FSD 컴포넌트 배치
- `runnable-composables` — composable 분리 기준
- `create-map-layer-sideeffect` — Cesium 레이어 추가
- `create-map-overlay` — 지도 위 오버레이 컨트롤
- `create-store-composable` — 상태 관리 composable
- `sync-overlay-visibility` — 오버레이 UI 그룹 동기화
- `create-bottom-drawer`, `create-popup-modal` — UI 패턴
