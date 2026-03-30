---
name: nuxt-migrate
description: 바닐라 JS/HTML 코드를 Nuxt 3 + Vue 3 Composition API 방식으로 마이그레이션한다. DOM 직접 조작·동적 스크립트 로딩·인라인 스타일을 제거하고 composable/component/CSS 파일로 분리한다.
disable-model-invocation: true
---

# Nuxt/Vue 마이그레이션 스킬

`$ARGUMENTS`에서 지정한 파일(또는 현재 작업 디렉토리 전체)을 대상으로 아래 단계를 순서대로 수행한다.

## 현재 상태 파악

```
- 브랜치: !`git branch --show-current`
- 변경 파일: !`git status --short`
```

---

## 1단계 — 구조 분석

마이그레이션 전 다음을 확인한다.

1. **레거시 코드 위치** — 바닐라 JS(`.js`), DOM 조작 함수, `document.getElementById`, `addEventListener` 호출을 탐색
2. **현재 Nuxt 구조** — `app/pages/`, `app/components/`, `app/composables/`, `app/layouts/`, `app/assets/css/` 존재 여부
3. **타입 정의** — JSDoc `@class` / `@typedef` → `shared/types/` TypeScript 인터페이스로 이전 가능한지 확인
4. **정적 자산** — `public/static/`, `sample/static/`, `src/assets/` 등 서빙되어야 할 파일 목록

---

## 2단계 — 타입 분리 (`shared/types/`)

레거시 JSDoc 클래스·typedef를 TypeScript interface/type으로 변환해 `shared/types/` 에 저장한다.

```typescript
// Before (JS JSDoc)
/** @typedef {{ name: string, position: [number,number,number] }} BaseNode */

// After (shared/types/example.ts)
export interface BaseNode {
  name: string
  position: [number, number, number]
}
```

- 파일명은 kebab-case, export는 named export 사용
- 기존 `shared/types/` 파일이 있으면 중복 확인 후 병합

---

## 3단계 — Composable 변환 (`app/composables/`)

DOM 직접 조작·전역 상태·외부 라이브러리 초기화 로직을 composable로 분리한다.

| 레거시 패턴 | 변환 후 composable |
|---|---|
| `window.viewer = new Lib(...)` 초기화 | `useLibInit.ts` — `init()` 함수 + 필요한 헬퍼 반환 |
| `window.state = { ... }` 전역 상태 | `useState('key', ...)` 를 사용하는 composable |
| 단위 변환·계산 유틸 함수 | `useMeasure.ts` 등 도메인별 composable |
| 데이터 트리 탐색(`findNodeById` 등) | `useThemeMap.ts` 등 데이터 composable |

**규칙:**
- `useState`로 SSR-safe 전역 상태 관리
- `ref` / `computed`로 반응형 변환
- `window.*` 접근은 `onMounted` 이후 또는 `if (import.meta.client)` 가드 안에서만 수행
- `definePageMeta({ ssr: false })`인 페이지에서만 사용하는 composable은 예외 허용

---

## 4단계 — Component 변환 (`app/components/`)

DOM 주입(`innerHTML`, `appendChild`, `createElement`) 패턴을 Vue 템플릿으로 대체한다.

```vue
<!-- Before: JS가 #result에 <ul> 주입 -->
<div id="result"></div>

<!-- After: Vue reactive 렌더링 -->
<ul class="tree-list">
  <li v-for="node in filteredTree" :key="node.id">...</li>
</ul>
```

**규칙:**
- 재귀 트리는 `<component :is="...">` 또는 자기 참조 컴포넌트(`MapSearchTree.vue`)로 구현
- `id` 기반 이벤트 바인딩(`document.getElementById('btn').addEventListener`) → `@click` 디렉티브로 전환
- 전역 상태 읽기/쓰기는 composable(`useMapInteraction` 등)을 통해 수행
- 모달 표시/숨김은 CSS 클래스 토글 대신 `:class="{ show: activeModal === 'name' }"` 사용

---

## 5단계 — 페이지 단순화 (`app/pages/`)

마이그레이션 완료 후 페이지는 다음 역할만 남긴다.

```vue
<script setup lang="ts">
// 1. definePageMeta (SSR, layout)
// 2. useHead (외부 CSS 링크 등)
// 3. composable 호출
// 4. 컴포넌트 간 이벤트 핸들러
// 5. onMounted — 외부 라이브러리 로딩 및 초기화
</script>

<template>
  <!-- 레이아웃 + 컴포넌트 조합만 -->
</template>
```

제거 대상:
- 동적 `<script>` 로딩(`loadScript()`)으로 불러오는 레거시 JS 파일
- `document.dispatchEvent(new Event('DOMContentLoaded'))` 트릭
- `window.xxx = function` 전역 함수 등록

---

## 6단계 — CSS 분리 (`app/assets/css/`)

Vue SFC의 `<style>` 블록을 별도 CSS 파일로 추출한다.

```
app/assets/css/
├── map.css          # CSS 변수, 전역 리셋, 레이아웃 컨테이너
├── search-panel.css # 검색 패널 + 트리
├── toolbox.css      # 툴박스 버튼 + 모달
└── slider.css       # 이미지 슬라이더 + 뷰어
```

- `app/layouts/map.vue`의 unscoped `<style>`에서 `@import`로 일괄 로드
- SFC에서 `<style>` / `<style scoped>` 블록 제거
- CSS 변수(`--header-height` 등)는 `map.css`의 `:root`에 집중 관리
- Cesium POI처럼 JS가 DOM에 직접 주입하는 클래스는 scoped 없이 전역 CSS 필수

---

## 7단계 — 정적 자산 이동

| 원본 위치 | 이동 후 | URL |
|---|---|---|
| `public/static/icons/` | `static/icons/` | `/static/icons/` |
| `public/static/images/` | `static/images/` | `/static/images/` |
| `sample/static/icons/` | `static/icons/` | (동일) |

`nuxt.config.ts`에 아래를 추가한다:

```ts
nitro: {
  publicAssets: [
    { dir: resolve(__dirname, 'static'), baseURL: '/static' },
    { dir: resolve(__dirname, 'lib'), baseURL: '/lib' }   // 외부 라이브러리 있을 경우
  ]
}
```

---

## 8단계 — 레거시 파일 제거

모든 기능이 Vue로 이전되었음을 확인한 뒤 삭제한다.

- `sample/` 디렉토리 전체
- `public/static/js/*.js` (composable로 이전된 파일)
- `public/static/json/*.js` (shared/data로 이전된 데이터)
- `public/js/*.js` (composable로 이전된 파일)

---

## 체크리스트

마이그레이션 완료 기준:

- [ ] `window.importThemeMap`, `window.drawPois` 등 전역 함수 등록 없음
- [ ] `document.getElementById`·`innerHTML` 직접 조작 없음 (Cesium POI 템플릿 문자열 제외)
- [ ] `loadScript()` 동적 로딩 없음 (외부 라이브러리 제외)
- [ ] `<style>` 블록이 Vue SFC에 없고 `app/assets/css/`에 CSS 파일이 있음
- [ ] `shared/types/`에 TypeScript 타입 정의 존재
- [ ] `sample/` 디렉토리 없음
- [ ] 브라우저에서 지도·검색·모달·슬라이더 정상 동작