# 경로 탐색

공개로 등록된 러닝 경로를 검색·선택하고, 3D 지도 위에 미리보기와 고도 그래프를 확인하는 기능이다.

---

## 사용 방법 (고객 관점)

### 1. 탐색 탭 진입

사이드바 하단 내비게이션에서 **탐색** 탭을 선택하면 공개 경로 목록이 표시된다.

### 2. 경로 검색

목록 상단 검색 입력란에 경로 제목의 일부를 입력하면 실시간으로 목록이 좁혀진다. 검색은 클라이언트 측 필터링으로 동작하므로 별도 요청 없이 즉시 반응한다.

### 3. 경로 선택 및 지도 미리보기

목록에서 경로 카드를 클릭하면 해당 경로의 구간이 3D 지도 위에 폴리라인으로 그려진다.

- 구간마다 고유한 색상이 적용되어 복수 구간을 구분할 수 있다.
- 출발점은 별도 마커 색상으로 표시되고, 각 구간 끝점에도 마커가 표시된다.
- 이미 선택된 경로를 다시 클릭하면 선택이 해제되고 미리보기가 지워진다.

### 4. 고도 그래프 확인

경로를 선택하면 화면 하단에 거리-고도 그래프가 자동으로 열린다.

- X축: 누적 거리 (km, 0.5 km 간격 눈금)
- Y축: 고도 (m)
- 구간별 색상 구분, 최고점·최저점 표시
- 총 거리, 누적 상승·하강 고도 요약 제공

---

## 기술 구현 (개발 관점)

### 아키텍처

경로 탐색은 다음 세 계층이 협력한다.

```
페이지 (index.vue)
  └─ useRouteMapFacade          ← 단일 진입점 Facade
       ├─ useRouteDrawStore      ← 공유 상태 (routes, searchQuery, selectedRouteId, elevationProfile 등)
       ├─ useRouteListSideeffect ← API 호출 + Cesium 엔티티 생명주기
       ├─ useTerrainSampler      ← Cesium 지형 고도 샘플링
       └─ useRouteElevationProfile (action) ← 거리·고도 프로필 순수 계산
```

탐색 기능은 `목록` 탭과 별도로 `탐색` 탭에서 동작하지만 내부 상태와 sideeffect를 공유한다. 탭 전환 시 `watch(store.activeNav)` 훅이 미리보기 정리와 선택 해제를 자동으로 처리한다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `app/components/map/templates/ExplorePanel.vue` | 공개 경로 목록 UI 컴포넌트 |
| `app/composables/useRouteMapFacade.ts` | 탐색 포함 전체 지도 기능 Facade |
| `app/composables/store/useRouteDrawStore.ts` | routes, searchQuery, selectedRouteId, elevationProfile 상태 보유 |
| `app/composables/sideeffect/useRouteListSideeffect.ts` | `/api/routes` 호출, Cesium 엔티티 추가·제거 |
| `app/composables/sideeffect/useTerrainSampler.ts` | 구간 좌표에 Cesium 지형 고도 삽입 |
| `app/composables/action/useRouteElevationProfile.ts` | 거리-고도 프로필 계산 (순수 함수) |
| `server/api/routes/index.get.ts` | 경로 목록 API (인증 여부에 따라 내 경로/공개 경로 반환) |
| `server/api/routes/search.get.ts` | 공개 경로 검색 API (`?q=` 쿼리) |
| `server/api/routes/[id]/sections.get.ts` | 선택된 경로의 구간 목록 API |

### 데이터 흐름

#### 목록 초기 로드

```
onMounted
  → listEffect.fetchRoutes()
    → GET /api/routes
      → store.routes ← SavedRoute[]
        → filteredRoutes (computed, searchQuery 필터 적용)
          → ExplorePanel props
```

#### 검색 필터링

```
사용자 입력 → store.searchQuery
  → filteredRoutes (computed)
    → ExplorePanel에 즉시 반영 (서버 요청 없음)
```

#### 경로 선택 → 지도 미리보기 + 고도 그래프

```
ExplorePanel @select(routeId)
  → exploreSelectRoute(routeId)
    → listEffect.clearPreview()         // 이전 엔티티 제거
    → listEffect.selectRoute(routeId)
        → GET /api/routes/:id/sections  // SavedSection[] 반환
        → store.selectedRouteId ← routeId
        → Cesium entities.add(polyline) × 구간 수
        → Cesium entities.add(point)    × 시작점 + 구간 끝점
    → buildSavedSectionInputs(sections)
    → terrainSampler.densifyAndSampleSections(sectionInputs)
        → Cesium sampleTerrainMostDetailed()
    → createRouteElevationProfile(densified)
    → openElevationChart(title, profile)
        → store.elevationProfile ← RouteElevationProfile
        → store.isElevationChartOpen ← true
```

#### 탭 전환 시 정리

```
watch(store.activeNav)
  그리기 탭 진입 시:
    → listEffect.clearPreview()   // Cesium 엔티티 제거
    → listEffect.clearSelection() // selectedRouteId = null
```

### API

#### `GET /api/routes`

인증 상태에 따라 반환 대상이 달라진다.

| 상태 | 반환 |
|------|------|
| 인증된 사용자 | 본인이 저장한 경로 목록 |
| 미인증 | 공개(public) 경로 전체 |

응답 타입: `SavedRoute[]`

#### `GET /api/routes/search?q={keyword}`

공개 경로를 키워드로 검색한다. `q` 파라미터가 없으면 전체 공개 경로를 반환한다.

응답 타입: `SavedRoute[]`

> 현재 클라이언트 검색(`filteredRoutes` computed)은 초기 로드된 `routes` 배열을 제목 기준으로 필터링한다. `/api/routes/search` 엔드포인트는 서버 측 검색이 필요한 경우를 위해 별도로 제공된다.

#### `GET /api/routes/:id/sections`

선택된 경로의 구간 목록을 반환한다. 각 구간의 `geom`(GeoJSON LineString)에서 좌표를 추출해 지도 폴리라인과 고도 프로필 계산에 사용한다.

응답 타입: `SavedSection[]`
