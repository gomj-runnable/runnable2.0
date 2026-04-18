# 2026-04-19 아키텍처 개선

GPT 상호 피드백 기반 아키텍처 평가 후 구현 일관성 개선 작업.

## 작업 목록

### 1. Composable 책임 분리 정리

- `useRouteDrawStore`: `ref()` 14개를 `useState()`로 전환 (교차 composable 상태 공유 보장)
- `useExploreSearchStore`: `useExploreSearchSideeffect`에서 상태 4개를 store로 분리
- `useDistrictStore` → `useDistrictSideeffect`: `$fetch` 로직을 store에서 sideeffect로 이전
- `useMapInit`: composable 루트에서 `sideeffect/`로 파일 이동

### 2. CSS 토큰 계층 정리

- `primitive.css`에 있던 semantic 역할 토큰 13개를 `semantic.css`로 이동
- score 인디케이터 토큰 3개 추가 (`--color-score-good/moderate/low`)
- `WeatherRecommendCard.css`의 하드코딩 색상 6개를 semantic 토큰으로 교체

### 3. 공유 타입 통합

- `GeoFeature` 타입을 `shared/types/geojson.ts`에 정의
- `useBoundarySideeffect`, `useCameraSideeffect`의 로컬 중복 타입 제거

### 4. Discover 필터 계약 수정

- `discover.get.ts`: `r.district === district` → `r.sgg?.includes(district)`
- 응답 매핑의 `district` 필드를 `r.sgg?.[0]`으로 수정

### 5. POI 데이터 DB 유실 수정

- `routeSections` Drizzle 스키마에 `pois` text 컬럼 추가
- `route.repository.drizzle.ts`: `createSection`/`createSections`에 pois 직렬화, `toSavedSection`에 역직렬화 추가

### 6. Share/Feedback API memory 모드 크래시 수정

- `share/[routeId].get.ts`: 직접 DB 접근 → `routeRepository` 경유로 전환
- `feedbacks/index.get.ts`: `db` null 가드 추가 (null이면 빈 배열 반환)
- `feedbacks/index.post.ts`: `db` null 가드 추가 (null이면 503 에러)

### 7. action 파일 Cesium DI 리팩터링

- `useRouteDrawUtils.ts`: Cesium 의존 함수 7개에 `cesium: CesiumRuntime` 파라미터 추가
- `useGroundClamping.ts`: 전체 4개 함수에 `cesium: CesiumRuntime` 파라미터 추가
- `CesiumRuntime` 타입 확장 (Color.BLACK, HeightReference, LabelStyle, VerticalOrigin, Cartesian2)
- sideeffect 호출부 6개 파일 업데이트

## 변경 파일

### 수정
- `app/assets/css/base/primitive.css`
- `app/assets/css/base/semantic.css`
- `app/assets/css/components/molecules/WeatherRecommendCard.css`
- `app/composables/action/useGroundClamping.ts`
- `app/composables/action/useRouteDrawUtils.ts`
- `app/composables/sideeffect/useBoundarySideeffect.ts`
- `app/composables/sideeffect/useCameraSideeffect.ts`
- `app/composables/sideeffect/useDistrictSideeffect.ts`
- `app/composables/sideeffect/useExploreSearchSideeffect.ts`
- `app/composables/sideeffect/useFacilitySideeffect.ts`
- `app/composables/sideeffect/useGradientSideeffect.ts`
- `app/composables/sideeffect/useRouteClosingSideeffect.ts`
- `app/composables/sideeffect/useRouteDrawSideeffect.ts`
- `app/composables/sideeffect/useRouteListSideeffect.ts`
- `app/composables/sideeffect/useWeatherSideeffect.ts`
- `app/composables/store/useDistrictStore.ts`
- `app/composables/store/useRouteDrawStore.ts`
- `server/api/routes/discover.get.ts`
- `server/api/routes/share/[routeId].get.ts`
- `server/api/routes/[routeId]/feedbacks/index.get.ts`
- `server/api/routes/[routeId]/feedbacks/index.post.ts`
- `server/database/schema/routes.ts`
- `server/repositories/route.repository.drizzle.ts`
- `shared/types/cesium.ts`
- `shared/types/geojson.ts`

### 추가
- `app/composables/sideeffect/useMapInit.ts` (루트에서 이동)
- `app/composables/store/useExploreSearchStore.ts`

### 삭제
- `app/composables/useMapInit.ts` (sideeffect/로 이동)
