# Simulation Drawer — 실제 구현 예시

## 구조

```
BottomDrawer (molecules)
└── SimulationDrawer (templates)
    ├── Row 1: Controls (Play/Pause, Stop, USlider, USelect)
    └── Row 2: Info (시간, 거리, 고도, 경사)
```

## 구체화 컴포넌트

```vue
<!-- app/components/map/templates/SimulationDrawer.vue -->
<script setup lang="ts">
import type { PlaybackSpeed } from '#shared/types/simulation'
import BottomDrawer from '~/components/map/molecules/BottomDrawer.vue'
import { useSimulationStore } from '~/composables/store/useSimulationStore'

defineProps<{ open: boolean }>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    play: []
    pause: []
    stop: []
    seek: [progress: number]
    speedChange: [speed: PlaybackSpeed]
}>()

const store = useSimulationStore()

const sliderProgress = computed(() => Math.round(store.progress.value * 100))

function onSeek(v: number | number[] | undefined) {
    if (v === undefined) return
    const val = Array.isArray(v) ? v[0] ?? 0 : v
    emit('seek', val / 100)
}
</script>

<template>
    <BottomDrawer :open="open" @update:open="$emit('update:open', $event)">
        <!-- 컨트롤 행 -->
        <div class="controls">
            <button @click="store.isPlaying.value ? emit('pause') : emit('play')">
                {{ store.isPlaying.value ? '⏸' : '▶' }}
            </button>
            <button @click="emit('stop')">■</button>
            <USlider :model-value="sliderProgress" :min="0" :max="100" @update:model-value="onSeek" />
            <USelect :model-value="store.playbackSpeed.value" :items="speedItems" size="sm" />
        </div>

        <!-- 정보 행 -->
        <div class="info">
            <span>시간 {{ elapsed }} / {{ total }}</span>
            <span>거리 {{ distance }}</span>
            <span>고도 {{ elevation }}</span>
            <span>경사 {{ gradient }}</span>
        </div>
    </BottomDrawer>
</template>
```

## 페이지 연결

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const isSimDrawerOpen = ref(false)

const showSimulationChip = computed(() => {
    if (activeNav.value === '그리기') return true
    if (activeNav.value === '목록' && routeList.selectedRouteId && sectionInfo.isOpen.value) return true
    if (activeNav.value === '탐색' && explore.selectedRouteId.value) return true
    return false
})

// 조건 해제 시 자동 닫기
watch(showSimulationChip, (visible) => {
    if (!visible) {
        isSimDrawerOpen.value = false
        if (simulation.playbackState.value !== 'stopped') {
            simulationEffect.stopPlayback()
        }
    }
})
</script>

<template>
    <SimulationDrawer
        v-model:open="isSimDrawerOpen"
        @play="simulationEffect.startPlayback(coordinates)"
        @pause="simulationEffect.pausePlayback()"
        @stop="simulationEffect.stopPlayback()"
        @seek="simulationEffect.seekTo($event)"
        @speed-change="simulation.setPlaybackSpeed($event)"
    />
</template>
```

## 핵심 패턴

- **store 직접 참조**: SimulationDrawer 내부에서 `useSimulationStore()`를 읽어 표시값 계산
- **이벤트 위임**: 재생/정지 등 동작은 emit으로 페이지에 위임
- **조건부 표출**: Chip 표출 조건과 Drawer 닫힘 조건을 `computed` + `watch`로 동기화
