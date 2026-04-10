<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# components

## Purpose
지도 페이지(`map/`)의 UI 컴포넌트를 Atomic Design 계층으로 구성한다.
atoms → molecules → organizations → templates 순서로 조합하며, 각 Vue 파일은 `assets/css/components/` 하위에 대응하는 외부 CSS 파일을 가진다.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `map/atoms/inputs/` | 최소 단위 입력 컴포넌트 (Textfield) |
| `map/molecules/buttons/` | 버튼 변형 (Button, FabButton, HelpButton, IconButton, ImageButton, PushButton, SegmentedButton, SquareButton) |
| `map/molecules/weather/` | 날씨 UI (WeatherLegend, WeatherDatePicker, WeatherLayerToggle) |
| `map/molecules/profiles/` | 사용자 프로필 (SidebarUserProfile) |
| `map/organizations/cards/` | 카드 조합 (Card, TextfieldCard) |
| `map/templates/` | 페이지 레이아웃 조합 (MapShell, MapSidebar, DrawRoutePanel, RouteListPanel, modals, WeatherOverlay) |

## For AI Agents

### Working In This Directory
- Vue 컴포넌트와 외부 CSS 파일은 반드시 1:1로 유지 (`<style src="...">`)
- atoms: 단일 HTML 요소 래핑, props만으로 동작
- molecules: atoms 조합, 단일 책임
- organizations: molecules 조합, 도메인 의미를 가진 단위
- templates: 페이지 구조 조합, composable과 직접 연결
- 새 컴포넌트 추가 시 대응하는 CSS 파일도 `assets/css/components/` 하위에 생성
- 공통 반복 패턴(버튼, 카드, 라벨)은 공용 CSS로 통합하고 modifier로 분화

### Testing Requirements
- `pnpm typecheck` 통과
- Vue 컴포넌트의 `style src` 경로가 실제 CSS 파일과 일치하는지 확인

## Dependencies

### Internal
- `composables/` — 상태와 이벤트 핸들러
- `assets/css/components/` — 외부 CSS
- `shared/types/` — 도메인 타입

<!-- MANUAL: -->
