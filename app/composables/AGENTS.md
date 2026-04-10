<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# composables

## Purpose
프론트엔드 로직을 책임별로 분리하는 패키지. `action`(순수 계산), `sideeffect`(외부 통신·브라우저 API), `store`(공유 상태)로 나누고, Facade(`useRouteMapFacade`)가 이를 조합해 페이지에 제공한다.

## Key Files
| File | Description |
|------|-------------|
| `useMapInit.ts` | Cesium 스크립트 동적 로드, viewer 초기화, 드로잉 헬퍼 부착 (sideeffect) |
| `useRouteMapFacade.ts` | store + 모든 sideeffect를 조합하는 Facade — 페이지는 이것만 사용 |
| `useWindow.ts` | `window.Cesium`, `window.viewer` 전역 타입 선언 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `action/` | 순수 계산 — elevation profile, GPX 생성, draw draft/utils, weather 변환 |
| `sideeffect/` | 외부 API·브라우저 API — draw, save, download, list, weather |
| `store/` | 공유 반응형 상태 — routeDrawStore, weatherStore |
| `constant/` | (향후) 상수 composable |

## For AI Agents

### 책임 분리 규칙 (CRITICAL)
| 패키지 | 허용 | 금지 |
|--------|------|------|
| `action/` | 순수 함수, 입출력 명확, 재사용·테스트 용이 | 외부 API, 전역 상태, 브라우저 IO |
| `sideeffect/` | 외부 통신, 브라우저 API, 타이머, Cesium | 상태 직접 소유 (store에 위임) |
| `store/` | `ref`/`useState` 기반 반응형 상태, 읽기·쓰기·파생 | 외부 통신, 복잡한 계산 로직 |

### Working In This Directory
- 하나의 composable이 action + sideeffect + store 책임을 동시에 갖지 않도록 분리
- 추상 함수 → `*Impl`로 구현 위임
- 사용자 지정 파라미터·반환값은 계약으로 취급 (임의 변경 금지)
- `useMapInit.ts`는 sideeffect 책임 — `onMounted`에서 `init()` 호출
- `useRouteMapFacade.ts`는 조합 책임 — 새 기능은 개별 composable에 추가 후 Facade에서 조합

### Key Composable Details
- **action/useRouteElevationProfile**: 거리-고도 프로필 계산 (draft 또는 saved sections)
- **action/useRouteGpx**: GPX XML 생성 + 파일명 생성
- **action/useRouteDrawDraft**: 구간 분할, 높이 보정 경로 geometry 생성
- **action/useRouteDrawUtils**: 드로잉 유틸리티 함수
- **action/useWeatherDataTransform**: 날씨 API 응답 → UI 데이터 변환
- **sideeffect/useRouteDrawSideeffect**: Cesium 드로잉 핸들러, 구간 편집
- **sideeffect/useRouteSaveSideeffect**: 경로 저장 API 호출
- **sideeffect/useRouteDownloadSideeffect**: GPX 파일 다운로드 (Blob)
- **sideeffect/useRouteListSideeffect**: 경로 목록 조회, 선택, 프리뷰
- **sideeffect/useWeatherSideeffect**: 날씨 API 조회 + 지도 오버레이
- **store/useRouteDrawStore**: 드로잉 상태, 구간 초안, 모달, 검색, 경로 목록
- **store/useWeatherStore**: 날씨 데이터 상태

### Testing Requirements
- action/ 함수는 순수 함수이므로 단위 테스트 용이
- sideeffect/ 는 의존성 주입·래핑으로 테스트 가능하게 설계

## Dependencies

### Internal
- `shared/types/` — route, cesium, geojson, weather 타입
- `shared/schemas/` — route.schema (RouteDraftBuilder, createSectionSchema)

### External
- Cesium.js — 3D 지도 API (window.Cesium)
- Vue 3 — reactivity (ref, computed, watch)

<!-- MANUAL: -->
