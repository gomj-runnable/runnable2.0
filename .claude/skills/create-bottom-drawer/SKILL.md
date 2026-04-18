# Create Bottom Drawer

하단 Drawer UI를 구현할 때 `BottomDrawer` 래퍼 컴포넌트를 사용하는 규칙.

## 언제 사용하는가

- 지도 위 하단에서 올라오는 패널/컨트롤러가 필요할 때
- 시뮬레이션, 경로 상세, 통계 요약 등 부가 정보를 하단 서랍에 담을 때
- Nuxt UI `UDrawer`를 직접 쓰지 않고 프로젝트 공통 설정을 재사용할 때

## 기본 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|----------|------|------|
| `BottomDrawer` | `app/components/map/molecules/BottomDrawer.vue` | UDrawer 래퍼, 공통 기본값 제공 |

## Props

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `open` | `boolean` | — | Drawer 열림 여부 (`v-model:open`) |
| `overlay` | `boolean` | `false` | 배경 오버레이 |
| `modal` | `boolean` | `false` | 모달 모드 (외부 상호작용 차단) |
| `handle` | `boolean` | `true` | 드래그 핸들 표시 |
| `dismissible` | `boolean` | `true` | 외부 클릭/ESC 닫기 |

## 사용 패턴

### 1. 구체화 컴포넌트 생성

`BottomDrawer`를 감싸는 전용 컴포넌트를 `templates/`에 만든다.

```vue
<script setup lang="ts">
import BottomDrawer from '~/components/map/molecules/BottomDrawer.vue'

defineProps<{ open: boolean }>()
defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
    <BottomDrawer :open="open" @update:open="$emit('update:open', $event)">
        <!-- 도메인별 콘텐츠 -->
    </BottomDrawer>
</template>
```

### 2. 페이지에서 사용

```vue
<script setup lang="ts">
const isDrawerOpen = ref(false)
</script>

<template>
    <MyFeatureDrawer v-model:open="isDrawerOpen" />
</template>
```

## 기존 구현 예시

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `SimulationDrawer` | `app/components/map/templates/SimulationDrawer.vue` | 시뮬레이션 재생 컨트롤 + 진행 정보 |

## 예시

→ 기본 사용법: [examples/basic.md](examples/basic.md)
→ 시뮬레이션 Drawer 구현: [examples/simulation.md](examples/simulation.md)

## 규칙

- `UDrawer`를 직접 사용하지 않고 `BottomDrawer`를 감싸서 구체화한다.
- 구체화 컴포넌트는 `templates/`에 둔다.
- `BottomDrawer` 자체에는 도메인 로직을 넣지 않는다. 공통 레이아웃(padding, gap)만 담당한다.
- `open` 상태는 부모 페이지에서 관리하고, `v-model:open`으로 전달한다.
- 지도 위에서 사용할 때는 `overlay: false`, `modal: false`를 유지한다 (기본값).

## 점검 항목

- `BottomDrawer`의 default 슬롯에 콘텐츠를 전달했는가
- `v-model:open` 바인딩이 페이지 ↔ Drawer 간 연결되었는가
- `UDrawer`를 직접 사용하지 않고 `BottomDrawer`를 경유했는가
- 도메인 로직이 `BottomDrawer`가 아닌 구체화 컴포넌트에 있는가
