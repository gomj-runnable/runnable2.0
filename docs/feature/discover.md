# 지역 기반 경로 탐색 (Discover)

## 사용 방법 (고객 관점)

1. **구역 선택** — 패널 상단의 구역 선택 영역에서 서울 25개 자치구 중 하나를 클릭한다. 선택된 구는 칩이 활성 상태로 표시되며, 같은 구를 다시 클릭하면 선택이 해제된다.
2. **지도 이동** — 구역을 선택하면 지도 카메라가 해당 구의 중심 좌표로 자동으로 이동한다 (1.5초 애니메이션, 고도 8,000m).
3. **경로 목록 확인** — 선택된 구에 공개된 경로 카드 목록이 패널 하단에 표시된다. 구를 선택하지 않은 경우 서울 전체의 공개 경로를 보여준다.
4. **정렬 변경** — 거리순, 고도순, 최신순, 인기순 중 하나를 선택해 경로 목록 정렬 기준을 바꿀 수 있다.
5. **경로 미리보기** — 경로 카드를 클릭하면 해당 경로가 지도 위에 미리보기로 표시된다.

## 기술 구현 (개발 관점)

### 아키텍처

Discover 기능은 `store → sideeffect → template → API` 흐름으로 동작한다.

- `useDiscoverStore` — 선택된 구, 경로 목록, 정렬 기준, 로딩 상태를 `useState`로 관리한다.
- `useDiscoverSideeffect` — `selectedDistrict` 변화를 감시(`watch`)하여 API 호출과 Cesium 카메라 이동을 수행한다.
- `DiscoverPanel` — `selectedDistrict`, `routes`, `isLoading`을 props로 받아 구역 선택 UI와 경로 카드 목록을 렌더링한다. 상태 변경 이벤트는 emit으로 상위에 위임한다.
- `DiscoverDistrictSelector` — 25개 자치구 칩(chip) 목록을 렌더링하고, 토글 선택을 `update:modelValue`로 emit한다.
- `GET /api/routes/discover` — 공개 경로를 조회한 뒤 구 필터와 정렬을 적용해 `RouteDiscoverCard[]`를 반환한다.

### 주요 파일

| 경로 | 역할 |
|------|------|
| `app/composables/store/useDiscoverStore.ts` | 구역 선택, 경로 목록, 정렬, 로딩 상태 관리 |
| `app/composables/sideeffect/useDiscoverSideeffect.ts` | API 호출, Cesium 카메라 이동, 상태 감시 |
| `app/components/map/templates/DiscoverPanel.vue` | 패널 레이아웃 조합 (구역 선택 + 경로 목록) |
| `app/components/map/molecules/DiscoverDistrictSelector.vue` | 25개 자치구 칩 선택 UI |
| `app/components/map/organizations/cards/RouteDiscoverCard.vue` | 개별 경로 카드 렌더링 |
| `server/api/routes/discover.get.ts` | 구 필터 + 정렬 + limit 적용 후 경로 목록 반환 |
| `shared/types/discover.ts` | `RouteDiscoverCard` 도메인 타입 |
| `shared/schemas/discover.schema.ts` | `routeDiscoverFilterSchema` (Zod 쿼리 파라미터 검증) |

### 데이터 흐름

```
사용자가 구 칩 클릭
  └─ DiscoverDistrictSelector emit update:modelValue
       └─ DiscoverPanel emit update:selectedDistrict
            └─ 상위(페이지/파사드)가 useDiscoverStore.selectedDistrict 갱신
                 └─ useDiscoverSideeffect.watch(selectedDistrict)
                      ├─ fetchRoutes(district)
                      │    └─ GET /api/routes/discover?district=&sortBy=
                      │         └─ discoverRoutes 갱신
                      └─ flyToDistrict(district)
                           └─ viewer.camera.flyTo({ destination, duration: 1.5 })
```

정렬 기준(`sortBy`)이 변경될 때는 `fetchRoutes`를 직접 호출해 목록을 다시 불러온다. 카메라 이동은 구 선택 시에만 발생한다.

### API

#### `GET /api/routes/discover`

공개 경로 목록을 구 필터와 정렬을 적용해 반환한다.

**쿼리 파라미터**

| 이름 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `district` | `string` (선택) | — | 조회할 서울 자치구 이름. 생략 시 전체 공개 경로 반환 |
| `sortBy` | `'distance' \| 'elevation' \| 'recent' \| 'popular'` | `'recent'` | 정렬 기준 |
| `limit` | `number` | `20` | 반환할 최대 경로 수 |

**정렬 기준 상세**

| 값 | 기준 |
|----|------|
| `recent` | `createdAt` 내림차순 (최신순) |
| `distance` | `distance` 내림차순 (거리 긴 순) |
| `elevation` | `highHeight` 내림차순 (고도 높은 순) |
| `popular` | 현재 `distance` 내림차순으로 대체 (추후 별도 기준 도입 예정) |

**응답 형식** — `RouteDiscoverCard[]`

```ts
interface RouteDiscoverCard {
    routeId: string
    title: string
    distance?: number      // 단위: km
    highHeight?: number    // 단위: m
    lowHeight?: number     // 단위: m
    district?: string
    createdAt?: string     // ISO 8601
    authorName?: string
}
```

**오류 응답**

| 상태 코드 | 원인 |
|-----------|------|
| `400` | 쿼리 파라미터가 스키마 검증(`routeDiscoverFilterSchema`)에 실패한 경우 |

#### 카메라 이동 기준점

`useDiscoverSideeffect`에 하드코딩된 서울 25개 자치구 중심 좌표(경도, 위도)를 사용한다. 카메라는 선택된 구의 좌표로 고도 **8,000m**, **1.5초** 동안 이동한다.
