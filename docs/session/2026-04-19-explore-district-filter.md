# 탐색 탭 시군구/읍면동 필터 + 법정동 기반 전환

---

## 1. 서울시 법정동 상수

**파일**: `shared/constants/seoul_district.ts`

- 서울 25개 시군구 → 467개 법정동 매핑 (`SEOUL_DISTRICT`)
- 출처: `southkorea/seoul-maps` juso/2015 (주소기반산업지원서비스, 법정동 기준)
- `SIGUNGU_LIST`: 시군구 이름 배열
- `getDongList(sigungu)`: 특정 시군구의 법정동 목록 반환

## 2. 탐색 탭 필터 UI

**파일**: `app/pages/index.vue`, `app/assets/css/pages/index.css`

- 탐색 탭에 시군구/읍면동 `USelect` 2개 + '초기화' `ChipButton` 추가
- 읍면동 Select는 시군구가 '전체'일 때 `disabled`
- Select 변경 시 즉시 필터 적용 (computed 기반)

## 3. 필터 상태 관리

**파일**: `app/composables/store/useExploreFilterStore.ts`

- `selectedSigungu`, `selectedDong` — `useState` 기반 공유 상태
- `setSigungu(value)` — 시군구 변경 시 읍면동 자동 초기화
- `resetFilters()` — 모든 필터 초기화
- `applyFilter(results)` — 경로의 `sgg`/`emd` 필드 기반 필터링
- `FILTER_ALL` 상수로 매직 스트링 제거

**파일**: `app/composables/sideeffect/useExploreSearchSideeffect.ts`

- `filter` 프록시로 store 위임
- `filteredResults` computed로 검색 결과에 필터 적용

## 4. 경로 저장 시 시군구/읍면동 자동 계산

**파일**: `server/utils/district-lookup.ts`

- 경로 좌표를 서울 boundary GeoJSON에 `@turf/turf` point-in-polygon으로 대조
- 좌표 샘플링 (최대 50개), SGG 매칭 후 해당 구의 EMD만 검사 (성능 최적화)
- Promise 캐싱으로 동시 요청 시 중복 fetch 방지

**파일**: `server/api/routes/index.post.ts`

- POST 시 전체 구간 좌표에서 `lookupDistricts()` 호출
- `sgg`/`emd` 배열을 자동 계산하여 경로에 저장

## 5. DB 스키마 변경

**파일**: `server/database/schema/routes.ts`

- `routes` 테이블에 `sgg`, `emd` text 컬럼 추가 (JSON stringified `string[]`)
- 마이그레이션: `server/database/migrations/0001_next_ken_ellis.sql`

**파일**: `shared/types/route.ts`, `shared/schemas/route.schema.ts`

- `RouteBase`에 `sgg?: string[]`, `emd?: string[]` 추가
- `createRouteSchema`에 Zod 배열 검증 추가

**파일**: `server/repositories/route.repository.drizzle.ts`

- `createRoute`에서 JSON stringify, `toSavedRoute`에서 JSON parse

## 6. 법정동 기반 전환

- `server/api/boundary/seoul-dong.get.ts` — GeoJSON URL을 `kostat/2013`(행정동) → `juso/2015/neighborhoods`(법정동)으로 변경
- `public/sidewalk/` — 111,510개 인도 polyline을 행정동 → 법정동 기준으로 재분류 (98.1% 매칭, 1.9% 기타)

## 7. 중복 import 정리

- `GeoJsonLineString` — `route.ts`의 re-export 제거, 소비자들이 `geojson.ts`에서 직접 import
- `RoutingServiceConfig` — `routing/index.ts`의 중복 정의 제거, `registry.ts`에서 import
- `DiscoverDistrictSelector.vue` — 하드코딩된 `DISTRICTS` 배열 제거, `SIGUNGU_LIST` import
