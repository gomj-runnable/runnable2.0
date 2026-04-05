---
name: runnable-components
description: This skill should be used when the user asks to "컴포넌트 구조를 정리", "UI 컴포넌트를 추가", "Toss 디자인 시스템 원칙에 맞게 구현", "molecules/templates 계층을 설계", "사이드바/지도 shell 컴포넌트를 수정"해야 할 때.
---

# Runnable Components Skill

`app/components/<page>/molecules/`와 `app/components/<page>/templates/` 계층을 기준으로 UI 컴포넌트를 설계하고 구현한다.

## 목적

Toss 디자인 시스템의 **Flat + Compound 병행 원칙**에 따라 확장성이 높은 컴포넌트를 만든다.
재사용 가능한 molecule 단위를 먼저 설계하고, template에서 slot 기반으로 조합한다.
페이지(`app/pages/`)는 template 조합만 수행하고 UI 세부 구현을 포함하지 않는다.

## Toss 디자인 시스템 원칙 (Flat + Compound 병행)

### Flat API

props만으로 기본 사용이 가능한 단순한 인터페이스를 제공한다.

```vue
<!-- 간단한 경우: props만으로 사용 -->
<MapSidebar>
  <template #header>
    <IconButton icon="i-lucide-map-pin" label="Runnable" />
  </template>
</MapSidebar>
```

### Compound API

slot과 sub-component 조합으로 자유로운 커스텀이 가능한 인터페이스를 제공한다.

```vue
<!-- 커스텀이 필요한 경우: slot으로 조합 -->
<MapSidebar>
  <template #header>
    <IconButton icon="i-lucide-map-pin" label="Runnable" />
    <IconButton icon="i-lucide-panel-left-close" />
  </template>
  <template #default>
    <PushButton label="새 경로" />
  </template>
  <template #footer>
    <SidebarUserProfile />
  </template>
</MapSidebar>
```

### 병행 원칙

- Flat API는 내부적으로 Compound(molecule) 컴포넌트를 render한다
- 사용자는 단순한 경우 Flat, 커스텀이 필요한 경우 Compound를 선택한다
- 확장 지점(slot)은 컴포넌트 설계 시 미리 명시한다

## 컴포넌트 계층 구조

### `app/components/<page>/molecules/`

재사용 가능한 최소 단위 UI 컴포넌트를 둔다.

- props로 데이터를 받고, slot으로 내용 교체를 허용한다
- 외부 상태나 composable에 직접 의존하지 않는다
- emit으로 사용자 인터랙션을 외부에 전달한다

현재 구현된 molecules (지도 페이지 기준):
- `molecules/buttons/Button.vue` — 공용 버튼 (appearance + role + size 조합)
- `molecules/buttons/IconButton.vue` — 아이콘 중심 버튼
- `molecules/buttons/PushButton.vue` — Apple push button 스타일 wrapper
- `molecules/buttons/SquareButton.vue` — 정사각형 버튼 wrapper
- `molecules/buttons/HelpButton.vue` — 도움말 버튼 wrapper
- `molecules/buttons/ImageButton.vue` — 이미지 버튼
- `molecules/buttons/SegmentedButton.vue` — 세그먼트 버튼
- `molecules/buttons/FabButton.vue` — FAB 계열 버튼
- `molecules/profiles/SidebarUserProfile.vue` — 유저/로그인 영역
- `atoms/inputs/Textfield.vue` — 공용 text field 입력

### `app/components/<page>/templates/`

molecules를 slot으로 조합하는 레이아웃 단위 컴포넌트를 둔다.

- 레이아웃 구조(flex, grid, 위치)를 담당한다
- 내용은 slot으로 받고 직접 렌더링하지 않는다
- Flat 사용을 위한 최소한의 props만 허용한다

현재 구현된 templates (지도 페이지 기준):
- `MapSidebar.vue` — 사이드바 전체 (header / body / footer 세 slot)
- `MapShell.vue` — 사이드바 + 뷰어 전체 Shell (sidebar / default / overlay 세 slot)
- `RouteSaveModal.vue` — 그리기 저장용 팝업 (route title / description / distance 확인)

## MapShell 슬롯 구조

```
MapShell
├── #sidebar    — 사이드바 영역 (MapSidebar 배치)
├── #default    — Cesium Viewer 영역 (<div id="map" /> 배치)
└── #overlay    — 지도 위 부유 UI (툴바, 패널 등, pointer-events 분리)
```

## MapSidebar 슬롯 구조

```
MapSidebar
├── #header     — 로고 + 아이콘 버튼 행
├── #default    — 검색 패널, 경로 목록, 액션 버튼 등 스크롤 영역
└── #footer     — 유저 프로필 / 로그인 영역
```

## 지도 사이드바 검색 패널 규칙

- 검색창은 헤더 아이콘 버튼으로 두지 말고 `MapSidebar`의 `#default` 영역 상단 패널에 둔다
- 헤더에는 브랜드 요소와 패널 열기/닫기 같은 전역 제어만 남긴다
- 검색 패널 내부 액션은 공용 `Button.vue` 또는 필요한 wrapper molecule로 분리한다
- `"검색"`, `"목록"` 같은 액션은 페이지에서 배열 데이터로 선언하고 `v-for`로 렌더링해 추후 항목 추가가 쉽도록 유지한다
- 펼침 상태에서는 텍스트 중심 버튼으로, 축소 상태에서는 icon + label 조합 버튼으로 표현을 바꾼다
- 축소 상태에서도 검색 패널 액션은 유지되어야 하므로 `MapSidebar` 본문 슬롯 자체를 숨기지 말고, 각 하위 UI가 `collapsed`에 맞게 자체 렌더링한다
- `"패널 열기" / "패널 닫기"` 토글은 헤더 기존 위치를 유지한다

예시:

```vue
<script setup lang="ts">
const sidebarButtons = [
  { id: 'search', label: '검색', icon: 'i-lucide-search', active: true },
  { id: 'list', label: '목록', icon: 'i-lucide-list', active: false }
]
</script>

<template>
  <section :class="{ collapsed }">
    <Textfield v-if="!collapsed" v-model="searchQuery" type="search" placeholder="검색" leading-icon="i-lucide-search" />
    <Button
      v-for="item in sidebarButtons"
      :key="item.id"
      :label="item.label"
      :icon="item.icon"
      :active="item.active"
      appearance="secondary"
    />
  </section>
</template>
```

## CSS 자산 구조

- raw value token(color palette, number scale, font scale, motion, border width)은 `app/assets/css/primitive.css`에서 관리한다
- semantic token(text role, gap, radius, control size, shadow, surface, transition)은 `app/assets/css/semantic.css`에서 관리한다
- 전역 엔트리 CSS는 `app/assets/css/base/main.css`를 기준으로 본다
- 지도 전역 스타일과 지도 DOM 전용 스타일은 `app/assets/css/base/main.css` 안의 map 전역 블록에서 관리한다
- 여러 map 컴포넌트가 공유하는 버튼, 카드, 입력, 라벨 골격은 `app/assets/css/components/map/common.css`에서 관리한다
- 컴포넌트와 template 스타일은 Vue 파일 안에 직접 쓰지 말고 `app/assets/css/components/<page>/.../*.css`로 분리한다
- 페이지 조합 스타일은 `app/assets/css/pages/*.css`로 분리하고 Vue 파일에서는 `<style scoped src=\"...\">`만 사용한다
- 팝업/모달 UI도 page에 직접 쓰지 말고 `templates/`로 분리한다

## CSS 변수 (primitive.css + semantic.css 기준)

primitive token은 값 자체를, semantic token은 역할을 표현한다. 새 컴포넌트에서는 semantic token을 우선 사용하고, semantic이 없다면 primitive를 직접 참조하기보다 semantic 추가를 먼저 검토한다.

```css
--size-6: 1rem;
--font-size-15: 1.5rem;
--text-label-small: var(--font-size-15);
--gap-4: var(--size-7);
--radius-control-md: var(--size-3);
--sidebar-bg: var(--surface-panel);
```

새로운 컴포넌트에서 색상/글꼴/크기 값을 하드코딩하지 말고 이 변수를 참조한다.

## 공통 CSS와 상태 클래스 규칙

- 반복되는 UI 골격은 공통 블록 클래스로 통합한다. 예: 버튼, 입력, 카드, 섹션 라벨
- 공통 블록은 `common.css`에 두고, 개별 CSS는 spacing, state, variant만 덮어쓴다
- 상태 클래스는 `.active`, `.collapse`처럼 모호한 이름보다 `.is-active`, `.is-collapsed`처럼 상태 의미가 드러나는 이름을 사용한다
- 폭/높이 값을 그대로 드러내는 `.w480` 같은 클래스는 지양하고 semantic token 또는 컴포넌트 고유 클래스에서 관리한다
- 컴포넌트 modifier가 필요하면 `component-name.is-active` 또는 `component-name--variant`처럼 역할 중심으로 유지한다

## 컴포넌트 설계 원칙

- **slot 우선** — 내용은 slot으로 받는다. props로 내용을 고정하면 확장이 막힌다
- **데이터는 props, 구조는 slot** — 데이터(label, icon, active)는 props, 레이아웃 구조는 slot
- **emit으로 인터랙션 전달** — composable 또는 상태 변경 로직을 컴포넌트 안에 넣지 않는다
- **semantic token 우선** — 색상/글꼴/크기 값은 `semantic.css`를 우선 참조하고, raw 값은 `primitive.css`에만 둔다
- **외부 CSS 분리** — 컴포넌트 스타일 정의는 `.vue` 안에 직접 쓰지 말고 외부 `.css` 파일로 분리한다
- **style src 사용** — Vue 파일에서는 `<style scoped src=\"...\">`만 사용하고, 실제 정의는 외부 CSS 파일에 둔다
- **전역 스타일 예외** — POI 마커 등 Cesium이 DOM에 직접 주입하는 전역 스타일만 `base/main.css` 같은 전역 CSS 경계에 둔다
- **저장 팝업 규칙** — `_drawAction()` 응답을 직접 template에서 가공하지 말고 `shared/schemas/route.schema.ts`의 class를 통해 route payload로 변환한 뒤 modal submit에서 저장한다

## 새 컴포넌트 추가 절차

1. 어느 페이지에 속하는지 결정한다 (`app/components/<page>/`)
2. molecule인지 template인지 판단한다
   - 최소 UI 단위 → `molecules/`
   - 여러 molecule을 조합하는 레이아웃 → `templates/`
3. Flat API(props)와 Compound API(slot) 중 무엇을 제공할지 결정한다
4. props → slot → emit 순서로 인터페이스를 설계한다
5. 스타일은 외부 CSS 파일에 작성하고 Vue 파일에서는 `style src`로 연결한다
6. 색상/글꼴/크기 토큰은 `semantic.css`를 우선 참조하고, 필요한 raw scale은 `primitive.css`에서 정의한다
7. 페이지(`index.vue`)에서 template를 통해 조합한다

## 점검 항목

- molecule이 composable이나 전역 상태에 직접 의존하지 않는가
- template이 내용을 직접 렌더링하지 않고 slot으로 위임하는가
- 확장 지점(slot)이 미리 명시되어 있는가
- CSS 값이 `semantic.css`를 우선 참조하고 있는가
- 중복되는 버튼/입력/카드 골격이 `common.css`로 통합 가능한 상태인가
- 상태 클래스 이름이 의미 중심(`is-*`)으로 정리되어 있는가
- `.vue` 파일 안에 스타일 정의가 남아 있지 않고 외부 CSS로 분리되어 있는가
- 페이지가 template 조합만 수행하고 있는가
