<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-10 | Updated: 2026-04-10 -->

# app

## Purpose
Nuxt 4 프론트엔드 루트. Cesium 3D 지도 위에서 러닝 경로를 그리고, 구간을 편집하고, 목록·저장·다운로드를 수행하는 SPA 화면을 구성한다. `ssr: false`로 동작하는 브라우저 전용 지도 페이지가 핵심이다.

## Key Files
| File | Description |
|------|-------------|
| `app.vue` | 루트 Vue 컴포넌트 |
| `app.config.ts` | Nuxt 앱 설정 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `assets/css/` | 디자인 토큰(primitive→semantic), 컴포넌트/페이지 CSS |
| `assets/icons/` | SVG 아이콘 자산 |
| `assets/images/` | 이미지 자산 |
| `components/map/` | 지도 페이지 UI 컴포넌트 계층 (see `components/AGENTS.md`) |
| `composables/` | 상태·로직·부수효과 분리 (see `composables/AGENTS.md`) |
| `layouts/` | 공통 레이아웃 |
| `pages/` | 라우트 페이지 (index.vue — ssr: false) |

## For AI Agents

### Working In This Directory
- 화면 조합은 `pages/`에서 최소한으로 유지
- 재사용 UI는 `components/map/`에 atomic design 계층으로 배치
- 상태와 사이드 이펙트는 `composables/`로 분리
- Cesium 전역 객체(`window.Cesium`, `window.viewer`)는 composable로 래핑
- CSS 토큰: `primitive.css` → `semantic.css` → feature CSS 계층 유지
- 외부 CSS는 `assets/css/components/` 하위에 Vue 컴포넌트와 1:1 매칭

### CSS Token Hierarchy
1. `assets/css/base/primitive.css` — raw value tokens
2. `assets/css/base/semantic.css` — role-name mapped tokens
3. `assets/css/base/main.css` — global entry (imports primitive → semantic → common)
4. `assets/css/components/**` — component-scoped styles
5. `assets/css/pages/**` — page-scoped styles

### Testing Requirements
- `pnpm typecheck` — TypeScript 타입 검사
- `pnpm lint` — ESLint 검사
- 브라우저 전용 코드는 `ssr: false` 페이지에서만 테스트

## Dependencies

### Internal
- `shared/types/` — 도메인 타입 (route, cesium, geojson, weather)
- `shared/schemas/` — Zod 검증 스키마
- `server/api/` — API 엔드포인트 호출

### External
- Vue 3 / Nuxt 4 — 프레임워크
- Cesium.js — 3D 지도 (동적 스크립트 로드)
- TailwindCSS 4 + @nuxt/ui 4 — 스타일
- @unovis/vue — 차트 (고도 프로필)
- Tiptap — 리치 텍스트

<!-- MANUAL: -->
