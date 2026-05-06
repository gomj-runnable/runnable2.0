# 리팩토링 진행 상황 (2026-05-06)

이전 라운드에서 안전한 12건은 이미 적용 완료 (T1 전체, T2-5, T4-17~23). 이번 라운드는 보류했던 11건을 순차 진행한다.

## 진행 순서

### Phase A — 안전한 추출 (low risk) ✅ 완료
- [x] **A-1** ✅ T3-13: `route.schema.ts`에서 `RouteDraftBuilder`/`RouteDraftAssembler` 클래스 분리 → `entities/route/lib/useRouteDraftBuilder.ts`
- [x] **A-2** ✅ T2-7: `useRouteInfoSideeffect`의 로컬 `createEntityGroup` 제거 → shared `createEntityGroup` 사용 (`add` 메서드 추가)
- [x] **A-3** ✅ T3-11: `index.vue`의 SecondPanel + breadcrumb 중복 → `SectionInfoSlideContent.vue` widget 추출
- [x] **A-4** ✅ T3-12: `useRouteMapFacade.buildSavePayload`(78줄) → `entities/route/lib/useRouteSaveBuilder.ts` 추출

### Phase B — API 일관성 ✅ 완료
- [x] **B-1** ✅ T2-8: 9개 핸들러의 `createError` 인라인 → `badRequest/notFound/conflict/forbidden/unauthorized/internalError` 유틸 통일 (auth의 503만 인라인 유지)
- [x] **B-2** ✅ T2-6: `withExceptionHandler` 래퍼를 Zod `.parse()` 쓰는 3개 핸들러에 적용 (`routes/index.post`, `routes/[routeId]/index.put`, `feedbacks/index.post`)

### Phase C — 구조 분리 ✅ 완료
- [x] **C-1** ✅ T3-10: `useRouteDrawSideeffect`에서 Split Mode(155줄) → `useSplitModeSideeffect.ts` 분리
- [x] **C-2** ✅ T3-15: weather/facility 도메인 Zod 스키마 신규 생성 (`shared/schemas/weather.schema.ts`, `shared/schemas/facility.schema.ts`)

### Phase D — 정책/툴링 ✅ 완료
- [x] **D-1** ✅ T3-9: ESLint `no-restricted-imports`로 FSD 경계 보호 룰 4계층 추가 (위반 0건)
- [x] **D-2** 🟡 T3-14: `EnumBase<K extends string = string>` 제네릭 추가 (하위 호환). 완전한 union 통합은 cyclic 의존 위험으로 단계적 진행 권고
- [x] **D-3** 🟢 T3-16: Adapter 캐싱은 의도된 비대칭 — airquality는 정시 갱신 고정 응답, observed/forecast는 요청 파라미터별 가변. `airquality.adapter.ts`에 설계 의도 주석 추가

## 최종 검증 (2026-05-06)
- 테스트: **450/450 통과** (22 files, 신규 RouteDraftBuilder 테스트 1 file 포함)
- ESLint: **0 errors** (FSD 경계 위반 0건)
- TypeScript: 신규 에러 0건 (사전 존재 pm25 1건 제외)

### 검증 절차
각 Phase 끝에 다음 실행:
1. `pnpm exec eslint --fix 'app/**/*.{ts,vue}' 'server/**/*.ts' 'shared/**/*.ts'`
2. `pnpm test` — 450개 테스트 모두 통과 유지
3. `pnpm exec nuxt typecheck` — 신규 에러 0건 (사전존재 pm25 1건 제외)

---

# CSS Tailwind 전환 — 미완료 항목

## Group C: 복잡한 CSS 변수 캐스케이드 (수동 전환 필요)

### `app/entities/user/ui/AuthModal.vue` + `AuthModal.css`
- `--map-form-*` CSS 변수 10개를 오버라이드하여 `common.css`의 `.map-form-control` 스타일을 커스터마이징
- Nuxt UI `<UInput>` / `<UButton>` `:ui` prop으로 대체하거나 scoped CSS 유지 필요

### `app/features/draw-route/ui/RouteSaveModal.vue` + `RouteSaveModal.css`
- `--map-form-*` CSS 변수 12개 오버라이드
- AuthModal과 동일한 패턴 — 함께 전환 권장

### `app/features/draw-route/ui/RouteElevationModal.vue`
- SVG 차트 스타일(stroke, fill, stroke-linecap 등)은 `<style scoped>`로 유지 중
- Tailwind의 SVG 유틸리티로 전환 가능하나 가독성 저하 우려

## Group D: `:deep()` 셀렉터 / 복합 그래디언트 (Tailwind 전환 불가 또는 비권장)

### `app/shared/ui/cards/Card.vue` + `Card.css`
- 다중 레이어 그래디언트, glow 오버레이, backdrop-filter, hover translateY
- `:is(button)` 셀렉터, 4가지 상태 변형 (hover/focus/selected/disabled)
- Tailwind 전환 시 arbitrary value 체인이 비현실적으로 길어짐

### `app/shared/ui/cards/TextfieldCard.vue` + `TextfieldCard.css`
- 12개 `:deep()` 셀렉터로 UInput 내부 요소(`.textfield__control`, `.textfield__input` 등) 스타일 오버라이드
- Nuxt UI `:ui` prop으로 일부 대체 가능하나 전체 전환은 UInput API 제약으로 어려움

## Group E: 글로벌 CSS (전환 불가)

### `app/assets/css/base/main.css` — Cesium DOM 주입 스타일 (lines 25~)
- `.icon-poi-wrap`, `.poi-label`, `img` — Cesium이 직접 DOM에 주입하는 요소
- Tailwind 클래스를 부여할 수 없으므로 글로벌 CSS 유지 필수

### `app/assets/css/components/common.css` — 공용 컴포넌트 디자인 시스템
- `.map-button`: 15개 CSS 변수 + 3단계 fallback 캐스케이드
- `.map-surface-card`, `.map-form-field`, `.map-form-control`, `.map-section-label`
- 소비처: AuthModal, RouteSaveModal, SidebarUserProfile, DiscoverDistrictSelector 등
- 전환 방안: Nuxt UI 컴포넌트로 일괄 교체하거나, `@layer components` + `@apply`로 리팩터링

## 전환 현황 요약

| 그룹 | 상태 | 파일 수 |
|------|------|---------|
| A: 즉시 전환 | **완료** | 14 |
| B: 표준 전환 | **완료** | 15 |
| C: 복잡 | 미완료 | 3 |
| D: CSS 유지 | 미완료 | 2 |
| E: 글로벌 유지 | 유지 | 2 |
| 시맨틱 토큰 | **완료** | main.css @theme |
| 고아 CSS 삭제 | **완료** | 22 files deleted |
