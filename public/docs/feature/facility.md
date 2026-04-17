# 편의시설

러닝 경로 제작 시 참고할 수 있는 주변 편의시설(횡단보도, 음수대, 보관함, 병원, 인도)을 3D 지도 위에 표시하고, 관심지점(POI)으로 경로 구간에 연결하는 기능이다.

---

## 사용 방법 (고객 관점)

### 시설물 유형 토글

지도 하단 오버레이에 시설물 유형별 칩 버튼이 나열된다. 칩을 클릭하면 해당 유형의 마커가 지도에 표시되고, 다시 클릭하면 숨겨진다. 여러 유형을 동시에 활성화할 수 있다.

| 유형 | 표시 이름 | 색상 |
|------|-----------|------|
| `sidewalk` | 인도 표시 | 회청색 (#78909C) |
| `crosswalk` | 횡단보도 | 녹색 (#4CAF50, 신호등 있음) / 주황색 (#FF9800, 신호등 없음) |
| `fountain` | 음수대 | 파란색 (#2196F3) |
| `locker` | 보관함 | 보라색 (#9C27B0) |
| `hospital` | 병원 | 빨간색 (#F44336) |

### 현재 위치 기반 검색

`crosswalk`, `fountain`, `hospital`, `sidewalk` 중 하나 이상이 활성화되면 오버레이 상단에 **현재 위치 검색** 버튼이 나타난다. 이 버튼을 누르면 현재 지도 중심 좌표 기준 약 5km 반경의 시설물 데이터를 새로 불러와 지도를 갱신한다. `locker`는 위치 기반 검색 대상에서 제외된다.

### 행정경계 표시

같은 오버레이 하단에 **시군구**, **읍면동** 칩이 있다. 클릭하면 서울 행정경계 GeoJSON 레이어가 지도 위에 겹쳐 표시되며, 시설물 레이어와 독립적으로 동작한다.

### POI 경로 구간 연결

활성화된 시설물 마커를 클릭하면 해당 시설물이 POI(관심지점)로 변환되어 현재 선택된 경로 구간에 연결된다. 연결 가능한 유형은 `crosswalk(CROSSWALK)`, `fountain(WATER)`, `hospital(HOSPITAL)`이며, `locker`와 `sidewalk`는 POI 변환 대상이 아니다.

---

## 기술 구현 (개발 관점)

### 아키텍처

```
FacilityOverlay.vue (UI 이벤트 발행)
        │  toggle / searchNearby emit
        ▼
useRouteMapFacade (조합 진입점)
        │
        ├─ useFacilityStore    — 시설물 데이터 · 활성 유형 상태
        └─ useFacilitySideeffect — Cesium 렌더링 · API 호출 부수 효과
```

- **Store**: `useState` 기반 전역 공유 상태. 시설물 목록(`facilities`), 활성 유형 집합(`activeTypes`), 로딩/검색 플래그를 소유한다.
- **Sideeffect**: `activeTypes` 변화를 `watch`로 감지해 Cesium Entity를 추가·제거한다. 데이터 패칭과 클릭 핸들러 등록도 이 레이어에서 처리한다.
- **UI**: `FacilityOverlay.vue`는 props로 상태를 받고 emit으로 이벤트만 올린다. 직접 상태를 변경하지 않는다.

### 주요 파일

| 파일 | 역할 |
|------|------|
| `shared/types/facility.ts` | `Facility`, `FacilityType`, `PoiDraftInput`, `PoiType`, `FacilityLayerConfig` 타입 정의 |
| `shared/types/facility-type.enum.ts` | `FacilityTypeEnum` — 유형별 label/icon/color/poiType을 인스턴스로 묶는 enum class |
| `shared/data/sample-facilities.ts` | 개발용 시설물 샘플 데이터 |
| `app/composables/store/useFacilityStore.ts` | 시설물 데이터·활성 유형 상태 관리, `FACILITY_LAYERS` 상수 도출 |
| `app/composables/sideeffect/useFacilitySideeffect.ts` | Cesium Entity 생성/제거, API 패칭, 클릭 이벤트 핸들러 |
| `app/components/map/templates/FacilityOverlay.vue` | 시설물 칩 버튼 UI, 행정경계 칩 포함 |
| `server/api/facilities/index.get.ts` | `GET /api/facilities` — 전체 시설물 목록 반환 |
| `server/api/facilities/nearby.get.ts` | `GET /api/facilities/nearby` — 좌표 기반 반경 필터 반환 |

### 데이터 흐름

#### 초기 로드 및 레이어 토글

```
사용자가 칩 클릭
  → useFacilityStore.toggleType(type)
  → activeTypes 변경
  → useFacilitySideeffect: watch(activeTypes) 트리거
    → fetchFacilities() (데이터 없을 때만 GET /api/facilities 호출)
    → showLayer(type) 또는 removeLayer(type)
      → Cesium viewer.entities.add / remove
```

#### 현재 위치 검색

```
사용자가 "현재 위치 검색" 클릭
  → useFacilitySideeffect.searchNearby()
  → useCameraStore에서 중심 좌표(lat, lng) 읽기
  → GET /api/facilities/nearby?lat=&lng=&types=
  → facilities 배열에서 검색 대상 유형만 교체 (locker 등 나머지 유지)
  → 활성 유형의 Cesium 레이어 재렌더링
```

#### POI 클릭 연결

```
사용자가 지도 위 시설물 마커 클릭
  → Cesium ScreenSpaceEventHandler (LEFT_CLICK)
  → entityToFacilityMap으로 Entity → Facility 역참조
  → facilityToPoiDraft(): FacilityType → PoiType 변환
  → onPoiClick(PoiDraftInput) 콜백 호출
  → 경로 구간 편집 레이어에서 POI 연결 처리
```

#### Cesium Entity 전략

- **횡단보도(`crosswalk`)**: 폴리라인 좌표(`polyline[]`)가 있으면 `createClampedPolyline`으로 선분 렌더링. 신호등 유무에 따라 색상 분기(녹색/주황색). 좌표 없으면 렌더링 생략.
- **나머지 유형**: `createClampedPoint` + `createClampedLabel`로 포인트 마커 + 이름 라벨 렌더링.
- 유형별 Entity 배열은 `entityMap: Map<FacilityType, Entity[]>`에 보관하고, 레이어 제거 시 순회하여 일괄 삭제한다.
- 컴포넌트 언마운트 시 `onBeforeUnmount`에서 `removeAllLayers()` + `clickHandler.destroy()`를 실행해 메모리를 정리한다.

### API

#### `GET /api/facilities`

전체 시설물 샘플 목록을 반환한다.

- **응답**: `Facility[]`
- **인증**: 없음 (현재 샘플 데이터 반환)

#### `GET /api/facilities/nearby`

현재 지도 중심 좌표 기준 반경 내 시설물을 필터링하여 반환한다.

| 쿼리 파라미터 | 타입 | 필수 | 설명 |
|--------------|------|------|------|
| `lat` | `number` | O | 위도 (WGS84) |
| `lng` | `number` | O | 경도 (WGS84) |
| `types` | `string` | X | 쉼표 구분 유형 목록 (기본값: `crosswalk,fountain,hospital`) |

- **응답**: `Facility[]` (반경 약 5km, 위도 1도 ≈ 111km 기준 0.045도 이내)
- **현재 구현**: 샘플 데이터 기반 필터링. 실 서비스 전환 시 DB 쿼리 또는 외부 POI API 연동 필요.

### 유형 확장 방법

새 시설물 유형을 추가할 때는 다음 순서로 진행한다.

1. `shared/types/facility.ts` — `FacilityType` 유니온에 키 추가
2. `shared/types/facility-type.enum.ts` — `FacilityTypeEnum`에 static 인스턴스 추가 (label/icon/color/poiType 지정)
3. `app/composables/sideeffect/useFacilitySideeffect.ts` — `ALL_FACILITY_TYPES` 배열에 추가, 필요 시 `SEARCHABLE_FACILITY_TYPES`에도 추가
4. 샘플 데이터(`shared/data/sample-facilities.ts`)에 테스트용 항목 추가
5. POI 변환이 필요하면 `shared/types/facility.ts`의 `PoiType`에 대응 값 추가 후 `facilityToPoiDraft` 매핑 업데이트
