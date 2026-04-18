# Basic Usage — BottomDrawer

## 1. 최소 구현 (구체화 컴포넌트)

```vue
<!-- app/components/map/templates/MyFeatureDrawer.vue -->
<script setup lang="ts">
import BottomDrawer from '~/components/map/molecules/BottomDrawer.vue'

defineProps<{ open: boolean }>()
defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
    <BottomDrawer :open="open" @update:open="$emit('update:open', $event)">
        <p>콘텐츠를 여기에 배치</p>
    </BottomDrawer>
</template>
```

## 2. 페이지에서 사용

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
import MyFeatureDrawer from '~/components/map/templates/MyFeatureDrawer.vue'

const isDrawerOpen = ref(false)
</script>

<template>
    <MyFeatureDrawer v-model:open="isDrawerOpen" />
</template>
```

## 3. Chip 버튼으로 토글

```vue
<ChipButton
    label="기능명"
    icon="i-lucide-some-icon"
    size="sm"
    appearance="elevated"
    :active="isDrawerOpen"
    @click="isDrawerOpen = !isDrawerOpen"
/>
```
