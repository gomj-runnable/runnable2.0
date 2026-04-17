# 경로 제작

## 사용 방법 (고객 관점)

### 1단계: 그리기 탭 진입

사이드바에서 **그리기** 탭을 클릭한다. 탭 전환 시 기존 경로 미리보기가 초기화되고 지도 드로잉 모드가 자동으로 시작된다.

### 2단계: 지도에 경로 그리기

- **좌클릭**: 경로 포인트를 추가한다. 클릭할 때마다 선분(폴리라인)이 이어진다.
- **우클릭**: 드로잉을 완료한다. 최소 2개 포인트 이상이어야 한다.
- 드로잉 중 화면 상단에 안내 토스트("좌클릭: 구간 추가 / 우클릭: 완료")가 표시된다.

### 3단계: 경로 닫기 모드 선택 (선택)

드로잉 완료 후 하단 칩 바에서 경로 형태를 선택할 수 있다.

| 모드 | 동작 |
|------|------|
| 기본 | 시작점과 끝점이 독립적인 편도 경로 |
| 도착지 연결 (loop-close) | 마지막 포인트에서 첫 포인트까지 1개 구간을 자동으로 추가해 순환 경로를 만든다 |
| 왕복 (round-trip) | 원래 경로의 역순 구간을 자동으로 미러링하여 왕복 코스를 만든다 |

### 4단계: 고도 그래프 확인

드로잉이 완료되면 하단에 **고도 그래프 칩 버튼**이 표시된다. 버튼을 클릭하면 거리-고도 프로필 차트를 열고 닫을 수 있다. 고도 데이터는 Cesium 지형 샘플러가 실제 지형 고도값을 채워 계산한다.

### 5단계: 구간 편집

드로잉 완료 후 사이드바 **구간 목록**에서 각 구간의 상세 정보를 입력할 수 있다.

- **구간 제목**: 구간의 이름 (예: "한강 구간")
- **구간 요약**: 80자 이내의 짧은 설명
- **구간 설명**: 멀티라인 상세 설명
- **구간 삭제**: 첫 번째 구간을 제외한 구간은 삭제 버튼으로 제거할 수 있으며, 삭제 시 직전 구간과 자동 병합된다.
- **POI 연결**: 구간 카드를 클릭해 활성화한 뒤 지도에서 시설(병원·횡단보도·음수대)을 선택하면 해당 구간에 연결된다.

### 6단계: 초기화 또는 저장

- **초기화 버튼**: 현재 드로잉과 구간 정보를 모두 지우고 새 드로잉을 시작한다.
- **저장 버튼**: 저장 모달이 열린다. 로그인하지 않은 경우 로그인 모달로 이동한다.

### 7단계: 저장 모달에서 경로 정보 입력 후 저장

모달에서 **경로 제목**과 **경로 설명**을 입력하고 저장을 확정한다. 저장이 완료되면 사이드바가 목록 탭으로 전환되고, 저장된 경로가 목록에 표시된다.

---

## 기술 구현 (개발자 관점)

### 아키텍처

경로 제작 기능은 단일 Facade composable(`useRouteMapFacade`)을 진입점으로 하며, 내부적으로 store·sideeffect·action 계층으로 책임을 분리한다.

```
페이지 (index.vue)
  └─ useRouteMapFacade          ← 단일 진입점
       ├─ useRouteDrawStore     ← 공유 상태 관리
       ├─ useRouteDrawSideeffect  ← Cesium 드로잉 렌더링 및 이벤트 처리
       ├─ useRouteClosingSideeffect ← 경로 닫기(loop-close) 렌더링
       ├─ useRouteSaveSideeffect   ← 저장 API 호출
       ├─ useRouteListSideeffect   ← 목록 조회·선택·미리보기
       ├─ useRouteOptimizationSideeffect ← 보행자 경로 보정
       ├─ useTerrainSampler        ← 지형 고도 샘플링
       └─ useRouteDrawDraft (action) ← 구간 초안 순수 계산
```

UI 컴포넌트는 Facade가 노출한 `drawing`, `saveModal`, `routeList`, `elevationChart`, `closing` 프록시 객체만 소비하고, 내부 store나 sideeffect에 직접 접근하지 않는다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `app/composables/useRouteMapFacade.ts` | 모든 경로 제작 기능의 단일 진입점. store·sideeffect 조합, 저장 페이로드 빌드, 고도 그래프 제어 |
| `app/composables/store/useRouteDrawStore.ts` | 드로잉 결과(positions·metrics), 구간 초안, 저장 모달 개폐, 경로 폼 입력, 고도 프로필 등 공유 상태 |
| `app/composables/sideeffect/useRouteDrawSideeffect.ts` | Cesium viewer API를 직접 호출해 폴리라인·포인트 마커를 그리고, 드로잉 이벤트를 처리 |
| `app/composables/action/useRouteDrawDraft.ts` | 구간 범위 생성·병합·속성 업데이트·삭제 등 순수 계산 로직 |
| `app/components/map/templates/DrawRoutePanel.vue` | 구간 목록 입력 UI (제목·요약·설명·POI 칩), 초기화·저장 버튼 |
| `app/components/map/templates/RouteOverlayBottomBar.vue` | 지도 하단 고도 칩 버튼, 경로 닫기 칩 바, 경사도 토글 |
| `server/api/routes/index.post.ts` | 경로 저장 API 엔드포인트 (`POST /api/routes`) |

### 데이터 흐름

#### 드로잉 완료까지

```
사용자 좌클릭/우클릭
  → viewer._drawAction()       (Cesium 내장 드로잉 헬퍼)
  → normalizeDrawPositions()   (GeoJsonPosition 배열로 정규화)
  → createHeightAwareRouteGeom() (LineString GeoJSON 생성)
  → store.drawnPositions, drawMetrics, sectionPointRanges, sectionDraft 갱신
  → redrawSectionGraphics()    (구간 폴리라인·마커 지도에 렌더링)
  → terrainSampler.densifyAndSampleSections() (지형 고도 샘플링)
  → createRouteElevationProfile() (거리-고도 프로필 계산)
  → elevationChart 열기
```

#### 저장까지

```
사용자 "저장" 버튼 클릭
  → handleDrawSave()           (구간 초안 Zod 파싱 → 저장 모달 열기)
  → 사용자 경로 제목·설명 입력
  → confirmSave()
      ├─ buildSavePayload()    (closingMode 적용, RouteDraftBuilder로 route 페이로드 빌드)
      ├─ saveEffect.saveRoute() → POST /api/routes
      ├─ listEffect.fetchRoutes() (목록 갱신)
      └─ store 초기화, 목록 탭 전환
```

#### 구간 삭제 시

```
사용자 구간 삭제 버튼 클릭
  → mergeSectionPointRanges()  (삭제 구간을 직전 구간으로 흡수)
  → removeSectionDraftAttr()   (속성 배열에서 해당 구간 제거)
  → syncSectionAttrs()         (seq 재정렬)
  → redrawSectionGraphics()    (지도 그래픽 동기화)
```

#### 경로 닫기 모드 적용

- `closingMode` ref가 변경될 때 `redrawSectionGraphics()`가 자동으로 재실행된다.
- 저장 시 `buildSavePayload()`에서 `closingMode` 값에 따라 positions·ranges·attrs에 가상 구간을 추가한다.
  - `loop-close`: 마지막 포인트 → 첫 포인트 구간 1개 추가
  - `round-trip`: 전체 경로의 역순 구간 미러링 추가

### API

#### `POST /api/routes`

경로와 구간을 동시에 생성한다. 세션 인증이 필수다.

**요청 바디**

```json
{
  "route": {
    "title": "한강 러닝 코스",
    "description": "선택 사항",
    "geoJson": { "type": "LineString", "coordinates": [[127.0, 37.5, 10.0], ...] },
    "distance": 5200,
    "isPublic": true
  },
  "sections": [
    {
      "geom": { "type": "LineString", "coordinates": [...] },
      "attrs": [{ "seq": 0, "name": "구간1", "comment": "요약", "description": "설명" }],
      "pois": [{ "type": "WATER", "name": "음수대A", "lat": 37.5, "lng": 127.0 }]
    }
  ]
}
```

**응답**

```json
{
  "route": { "routeId": "uuid", "title": "한강 러닝 코스", ... },
  "sections": [{ "sectionId": "uuid", ... }]
}
```

**오류**

| 상태 | 원인 |
|------|------|
| 401 | 미인증 (세션 없음) |
| 422 | 요청 바디 스키마 검증 실패 |
