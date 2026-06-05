# 10-4. 공유 경로 페이지 (`/share/[routeId]`)

## 1. 개요

| 항목      | 값                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------- |
| 페이지 ID | `screen-share`                                                                                      |
| 라우트    | `/share/[routeId]` (예: `/share/abc123`)                                                            |
| 파일      | `app/pages/share/[routeId].vue`                                                                     |
| SSR       | `false`                                                                                             |
| 목적      | 인증 없이 접근 가능한 공유 뷰어. 3D 지도 위에 경로 폴리라인을 렌더링하고 좌상단에 메타 정보를 표시. |

## 2. 진입 경로

- 메인 페이지 경로 카드 → "공유" → URL 복사 → 외부에서 접근
- 공유받은 링크 직접 클릭 (메신저/이메일/SNS)

## 3. 화면 레이아웃

<!-- TODO(image): docs/wiki/images/screen-share-loaded.png — 경로 렌더된 정상 상태 -->
<!-- TODO(image): docs/wiki/images/screen-share-loading.png — 로딩 -->
<!-- TODO(image): docs/wiki/images/screen-share-error.png — 에러 (재시도 / 홈으로) -->

```
정상 (sharedData):
┌──────────────────────────────────────────────────────┐
│ ┌──────────────────────┐                              │
│ │ 경로 제목            │                              │
│ │ 설명 (line-clamp-2)  │                              │
│ │ 거리 X km · 고도 …   │                              │
│ │ by 작성자 · 메모 N개 │                              │
│ └──────────────────────┘                              │
│                                                       │
│              Cesium 3D 지도 (경로 폴리라인)            │
│                                                       │
└──────────────────────────────────────────────────────┘

로딩:
┌──────────────────────────────────────────────────────┐
│                  경로를 불러오는 중...                │
└──────────────────────────────────────────────────────┘

에러:
┌──────────────────────────────────────────────────────┐
│            ⚠  경로를 불러올 수 없습니다.              │
│             잠시 후 다시 시도해주세요.                │
│           [ 다시 시도 ]  [ 홈으로 ]                   │
└──────────────────────────────────────────────────────┘
```

- 배경: `bg-[#111]` 전체 흑색, 지도 컨테이너 `#map` 가 `absolute inset-0`
- 정보 오버레이: `top-4 left-4`, `bg-black/70 backdrop-blur-sm`, `max-w-xs`
- 로딩/에러 메시지: 중앙 정렬, z-10

## 4. 컴포넌트 구성

| 영역            | 컴포넌트 / 코드                                                  | 책임                                   |
| --------------- | ---------------------------------------------------------------- | -------------------------------------- |
| 지도 컨테이너   | `<div id="map">`                                                 | Cesium viewer 마운트 타깃              |
| 지도 초기화     | `useMapInit().init()`                                            | viewer 인스턴스 생성                   |
| 렌더 sideeffect | `useShareViewerSideeffect({ viewer })`                           | `renderSections(sections)` / `clear()` |
| 로딩 상태       | inline `<div v-if="isLoading">`                                  | 텍스트 안내                            |
| 에러 상태       | `UIcon i-lucide-circle-alert` + 2 `UButton` (다시 시도 / 홈으로) | 재시도 / 홈 이동                       |
| 정보 오버레이   | `<div>` + 제목 / 설명 / 메타                                     | 경로 메타 정보 표시                    |

### 정보 오버레이 메타

- `title`
- `description` (옵션, `line-clamp-2`)
- `거리 N km` (computed `distanceKm` — `Number(distance)/1000` 소수 2자리)
- `고도 {low}m ~ {high}m` (computed `elevationRange`, 둘 다 있을 때만)
- `by {authorName}` (있을 때만)
- `경로정보 N개` (`routeInfos.length`)

## 5. 인터랙션

### 5-1. 로딩 시퀀스

1. `onMounted`:
    1. `loadShare()` → `GET /api/routes/share/${routeId}` → `sharedData = { route, sections, routeInfos }`
    2. `init()` (Cesium 초기화)
    3. `viewer.value = (window as any).viewer ?? null`
    4. `sharedData && viewer` 면 `shareViewer.renderSections(sections)`
2. `onUnmounted` → `shareViewer.clear()` (entities 정리)

### 5-2. 에러 핸들링

- fetch 실패 시 `error = '경로를 불러올 수 없습니다.'` + console.error
- 에러 화면: "다시 시도" 클릭 → `retry()` (재시도 + render)
- "홈으로" → `/` 이동

### 5-3. 비공개 / 존재하지 않는 routeId

- 서버 `/api/routes/share/{routeId}` 가 404 또는 비공개 처리 → 클라이언트는 동일한 에러 화면

## 6. 데이터 / API

| 의존                              | 형태                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /api/routes/share/{routeId}` | `{ route: SavedRoute, sections: SavedSection[], routeInfos: Array<...> }` — **인증 불필요** |
| `useMapInit`                      | Cesium viewer 부트스트랩                                                                    |
| `useShareViewerSideeffect`        | `renderSections(sections)`, `clear()`                                                       |

> **로컬 store 미사용** — 페이지 상태(`sharedData`, `error`, `isLoading`, `viewer`)는 모두 페이지 로컬 ref. 코어 store (route draw / route info / auth) 에 의존하지 않음. 격리된 read-only 뷰.

## 7. 권한 / 비로그인 동작

| 상태                  | 동작                                                           |
| --------------------- | -------------------------------------------------------------- |
| 비로그인              | **정상 동작** — 인증 미들웨어 없음. 공유 자체가 익명 공개 의도 |
| 로그인                | 동일하게 read-only 뷰. AuthStore 와 무관                       |
| 비공개 경로 routeId   | 서버가 거부 → 에러 화면                                        |
| 존재하지 않는 routeId | 서버 404 → 에러 화면                                           |

> 비공개 / 비공개 전환된 경로에 대한 처리는 서버 `GET /api/routes/share/{routeId}` 가 담당. 클라이언트는 fetch 실패만 본다.

## 8. 관련 코드

- 페이지: `app/pages/share/[routeId].vue`
- 지도 초기화: `app/shared/lib/map/useMapInit.ts`
- 공유 뷰어 sideeffect: `app/features/share-viewer/api/useShareViewerSideeffect.ts`
- 서버 핸들러: `server/api/routes/share/[routeId].get.ts`
- 타입: `#shared/types/route` (`SavedRoute`, `SavedSection`)

## 9. 관련 PR / 이슈

- 공유 기능은 epic #330 보존 영역(`share-viewer`)
- route-social (좋아요/소유자 액션) 은 코어 메인 화면에서 처리. 공유 페이지에는 노출되지 않음 (읽기 전용 의도)
