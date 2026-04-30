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
