<script setup lang="ts">
// 2D/3D 화면 모드를 토글하는 헤더 버튼. 클릭 시 store만 변경하며
// 실제 카메라 전환은 useViewModeSideeffect가 store를 watch해 수행한다.
import { useViewModeStore } from '../model/useViewModeStore'

const store = useViewModeStore()

/** 클릭 시 전환될 대상 모드 라벨 (현재 3D면 "2D" 표시) */
const targetLabel = computed(() => (store.is2D.value ? '3D' : '2D'))
</script>

<template>
    <UButton
        color="neutral"
        variant="ghost"
        :disabled="store.isTransitioning.value"
        :loading="store.isTransitioning.value"
        :aria-label="`${targetLabel} 모드로 전환`"
        @click="store.toggle()"
    >
        {{ targetLabel }}
    </UButton>
</template>
