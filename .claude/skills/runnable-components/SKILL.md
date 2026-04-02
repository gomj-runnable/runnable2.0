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
<MapSidebar logo-icon="i-lucide-map-pin" logo-label="Runnable" />
```

### Compound API

slot과 sub-component 조합으로 자유로운 커스텀이 가능한 인터페이스를 제공한다.

```vue
<!-- 커스텀이 필요한 경우: slot으로 조합 -->
<MapSidebar>
  <template #header>
    <SidebarLogo icon="i-lucide-map-pin" label="Runnable" />
    <SidebarIconButton icon="i-lucide-search" label="검색" />
  </template>
  <template #default>
    <SidebarActionButton icon="i-lucide-plus">새 경로</SidebarActionButton>
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
- `SidebarLogo.vue` — 브랜드 로고 (icon + label, 각각 slot으로 교체 가능)
- `SidebarIconButton.vue` — 아이콘 전용 버튼 (active 상태, aria-label 필수)
- `SidebarActionButton.vue` — CTA 버튼 (icon prop + default slot)
- `SidebarRouteItem.vue` — 경로 목록 아이템 (trailing slot으로 배지 추가 가능)
- `SidebarUserProfile.vue` — 유저/로그인 영역 (image prop 또는 icon slot)

### `app/components/<page>/templates/`

molecules를 slot으로 조합하는 레이아웃 단위 컴포넌트를 둔다.

- 레이아웃 구조(flex, grid, 위치)를 담당한다
- 내용은 slot으로 받고 직접 렌더링하지 않는다
- Flat 사용을 위한 최소한의 props만 허용한다

현재 구현된 templates (지도 페이지 기준):
- `MapSidebar.vue` — 사이드바 전체 (header / body / footer 세 slot)
- `MapShell.vue` — 사이드바 + 뷰어 전체 Shell (sidebar / default / overlay 세 slot)

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
├── #default    — 경로 목록, 액션 버튼 등 스크롤 영역
└── #footer     — 유저 프로필 / 로그인 영역
```

## CSS 변수 (map.css 기준)

사이드바 관련 CSS 변수는 `app/assets/css/map.css`의 `:root`에서 관리한다.

```css
--sidebar-width: 132px;
--sidebar-bg: #0d0d0d;
--sidebar-border: rgba(255, 255, 255, 0.06);
--sidebar-icon-color: rgba(255, 255, 255, 0.45);
--sidebar-icon-hover: rgba(255, 255, 255, 0.85);
--sidebar-item-hover: rgba(255, 255, 255, 0.05);
--sidebar-item-active: rgba(255, 255, 255, 0.09);
```

새로운 컴포넌트에서 색상/크기 값을 하드코딩하지 말고 이 변수를 참조한다.

## 컴포넌트 설계 원칙

- **slot 우선** — 내용은 slot으로 받는다. props로 내용을 고정하면 확장이 막힌다
- **데이터는 props, 구조는 slot** — 데이터(label, icon, active)는 props, 레이아웃 구조는 slot
- **emit으로 인터랙션 전달** — composable 또는 상태 변경 로직을 컴포넌트 안에 넣지 않는다
- **CSS 변수 참조** — 색상/크기 값은 map.css 변수에서 가져온다
- **scoped 스타일** — 컴포넌트 스타일은 `<style scoped>`로 격리한다 (POI 마커 등 Cesium이 DOM에 직접 주입하는 전역 스타일은 예외)

## 새 컴포넌트 추가 절차

1. 어느 페이지에 속하는지 결정한다 (`app/components/<page>/`)
2. molecule인지 template인지 판단한다
   - 최소 UI 단위 → `molecules/`
   - 여러 molecule을 조합하는 레이아웃 → `templates/`
3. Flat API(props)와 Compound API(slot) 중 무엇을 제공할지 결정한다
4. props → slot → emit 순서로 인터페이스를 설계한다
5. 스타일은 CSS 변수를 참조하는 scoped 스타일로 작성한다
6. 페이지(`index.vue`)에서 template를 통해 조합한다

## 점검 항목

- molecule이 composable이나 전역 상태에 직접 의존하지 않는가
- template이 내용을 직접 렌더링하지 않고 slot으로 위임하는가
- 확장 지점(slot)이 미리 명시되어 있는가
- CSS 값이 map.css 변수를 참조하고 있는가
- 페이지가 template 조합만 수행하고 있는가