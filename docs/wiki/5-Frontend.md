# 5. Frontend

Nuxt 4 + Vue 3 + Cesium 1.140 기반 SPA. `app/` 디렉터리, **FSD(Feature-Sliced Design)** 변형 적용.

## 5.1 디렉터리 구조

```
app/
├─ entities/             # 도메인 단위
│  ├─ boundary/  facility/  gradient/  notification/
│  ├─ route/  user/  weather/
├─ features/             # 기능 단위
│  ├─ camera/  discover/  draw-route/  elevation-layer/
│  ├─ explore/  route-info/  share-viewer/
│  ├─ stats/  weather-overlay/
├─ widgets/              # 화면 단위
│  ├─ facility-overlay/  map-shell/
├─ shared/               # 공통
│  ├─ lib/               # composable utilities + map utilities
│  ├─ model/             # 공유 model
│  └─ ui/                # UI primitives (cards 등)
├─ pages/                # Nuxt 라우팅
├─ middleware/, plugins/, assets/
```

## 5.2 Composables 패턴

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

## 5.3 Map (Cesium) 레이어

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

## 5.4 Overlay 가시성 동기화

**경로 컨텍스트에 따라 오버레이 UI 그룹의 표출·정리를 일괄 동기화**합니다.

- 핵심 enum — `shared/types/map-overlay-context.enum.ts`
- 패턴 — 스킬 `sync-overlay-visibility` 의 가이드 참고
- 사용처 — 카드가 사라지면 연관 칩/버튼도 같이 숨김

## 5.5 화면 단위 (Widgets)

| Widget             | 역할                      |
| ------------------ | ------------------------- |
| `map-shell`        | Cesium 지도 + 기본 컨트롤 |
| `facility-overlay` | 시설물 레이어 오버레이    |

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
