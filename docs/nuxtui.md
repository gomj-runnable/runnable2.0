# Issue #39: Nuxt UI 4 컴포넌트 전면 통일 — 진행계획

## 1. 현황 분석

### 1.1 이미 적용된 Nuxt UI 컴포넌트
- `UApp` — `app.vue`에서 래퍼로 사용 중
- `UIcon` — 커스텀 버튼 내부에서 아이콘 렌더링에 사용
- `USelect` — 탐색 필터(시군구/읍면동)에 사용
- `UModal` — AuthModal에서 부분 적용
- `USlider` — 시뮬레이션 등에서 사용
- `app.config.ts` — input, textarea, checkbox, modal 테마 커스터마이징 존재

### 1.2 교체 대상 커스텀 컴포넌트 (FSD 구조 기준)
| 현재 위치 | 컴포넌트 | Nuxt UI 대체 |
|-----------|----------|-------------|
| `shared/ui/buttons/Button.vue` | Button | `UButton` |
| `shared/ui/buttons/ChipButton.vue` | ChipButton | `UButton variant="subtle"` |
| `shared/ui/buttons/IconButton.vue` | IconButton | `UButton variant="ghost" + icon` |
| `shared/ui/buttons/HelpButton.vue` | HelpButton | `UButton + UTooltip` |
| `shared/ui/buttons/ImageButton.vue` | ImageButton | `UButton + img slot` |
| `shared/ui/inputs/Textfield.vue` | Textfield | `UInput` |
| `shared/ui/cards/Card.vue` | Card | `UCard` |
| `shared/ui/cards/TextfieldCard.vue` | TextfieldCard | `UCard + UInput` |
| `shared/ui/HoverTooltip.vue` | HoverTooltip | `UTooltip` |
| `shared/ui/BottomDrawer.vue` | BottomDrawer | `UDrawer direction="bottom"` |
| `shared/ui/PopupModal.vue` | PopupModal | `UModal` |
| `widgets/map-shell/ui/MapSidebar.vue` | MapSidebar | `USidebar` |
| `widgets/map-shell/ui/MapSidebarTabs.vue` | MapSidebarTabs | `UTabs` 또는 `UNavigationMenu` |

### 1.3 Issue #39 보완 사항

1. **FSD 전환 반영**: Issue 작성 시점은 Atomic Design 구조 기준이었으나, 현재는 FSD로 전환됨. 파일 경로가 `app/shared/ui/`, `app/widgets/`, `app/features/` 등으로 변경됨.
2. **USidebar 적용 추가**: Issue에는 사이드바 교체가 없었으나 사용자 요청에 따라 `MapSidebar` → `USidebar` 전환을 Phase 2로 추가.
3. **Close Icon 위치**: USidebar의 `close` prop 대신 header slot 내부에 토글 버튼을 직접 배치하여 현재 UX 유지.
4. **CSS 토큰 연동**: `app.config.ts` 테마에서 `var(--color-*)` semantic token을 이미 사용 중이므로, 교체 후에도 동일 토큰 체계 유지.
5. **SegmentedButton/FabButton CSS 제거**: FSD 전환 시 이미 삭제된 파일이므로 추가 작업 불필요.

## 2. 진행 계획

### Phase 1: defineLocale 한국어 설정
- `app.vue`에 `defineLocale` 적용 (alert, modal, toast 등 한국어 메시지)
- 변경 파일: `app/app.vue`

### Phase 2: MapSidebar → USidebar 전환
- `USidebar` 도입: `collapsible="offcanvas"`, `side="left"`
- Close/Toggle 버튼은 header slot 내부에 `UButton variant="ghost"` + panel-left-open/close 아이콘
- `MapShell.vue`의 sidebar 영역을 `USidebar`로 대체
- 변경 파일: `widgets/map-shell/ui/MapShell.vue`, `widgets/map-shell/ui/MapSidebar.vue` (삭제 또는 대폭 수정)
- CSS: `MapShell.css`의 `.map-shell__sidebar` 폭 제어를 USidebar CSS 변수로 위임

### Phase 3: Button 계열 → UButton
- `Button.vue` → `UButton` (variant 매핑: prominent→solid, secondary→outline, tinted→subtle, plain→ghost)
- `IconButton.vue` → `UButton variant="ghost" icon="..."` (아이콘+레이블 조합)
- `ChipButton.vue` → `UButton variant="subtle" size="sm"` + leading icon
- `HelpButton.vue` → `UButton variant="ghost"` + `UTooltip` 래핑
- 사용처 전수 업데이트 (index.vue, MapSidebarTabs, DrawRoutePanel 등)

### Phase 4: Form/Input 계열 → UInput
- `Textfield.vue` → `UInput` (leading-icon → `icon` prop, placeholder 유지)
- `TextfieldCard.vue` → `UCard` + `UInput` 조합
- 사용처: index.vue 검색 필드, 탐색 패널 등

### Phase 5: Overlay 계열
- `HoverTooltip.vue` → `UTooltip` (text prop + slot)
- `BottomDrawer.vue` → `UDrawer direction="bottom"`
- `PopupModal.vue` → `UModal` (이미 부분 적용, 통일)

### Phase 6: Navigation 계열
- `MapSidebarTabs.vue` → USidebar 내부의 `UNavigationMenu orientation="vertical"` 또는 별도 `UTabs`
- `GradientToggle`, `WeatherLayerToggle` → `USwitch` 또는 `UButtonGroup`

### Phase 7: 정리
- 교체 완료된 커스텀 컴포넌트 파일 삭제
- 관련 CSS 파일 삭제
- `shared/ui/index.ts` export 정리
- `pnpm typecheck` + `pnpm lint` 통과 확인

## 3. 주의 사항

- USidebar는 `v-model:open`으로 접힘 상태를 제어하며, MapShell의 기존 `isSidebarCollapsed` ref와 연동
- SecondPanel 열림 시 사이드바 축소 로직은 USidebar의 `open` 바인딩으로 자연스럽게 연결
- app.config.ts의 기존 테마 설정(input, modal 등)은 유지하되, button 테마를 추가
- 각 Phase 완료 후 빌드 검증하여 점진적 안정성 확보
