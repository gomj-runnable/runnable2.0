<script setup lang="ts">
import type { PlaybackSpeed } from '#shared/types/simulation'
import BottomDrawer from '~/shared/ui/BottomDrawer.vue'
import { useSimulationStore } from '~/features/simulation/model/useSimulationStore'

defineProps<{
    open: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    play: []
    pause: []
    stop: []
    seek: [progress: number]
    speedChange: [speed: PlaybackSpeed]
}>()

const store = useSimulationStore()

const totalSeconds = computed(() => Math.round(store.totalDurationMs.value / 1000))
const sliderProgress = computed(() => Math.round(store.progress.value * 100))

/** progressInfo가 없을 때 0 기본값을 표시한다. */
const displayInfo = computed(
    () =>
        store.progressInfo.value ?? {
            distanceFromStart: 0,
            totalDistance: 0,
            currentElevation: 0,
            currentGradient: 0,
            progress: 0
        }
)

const speedItems = [
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '5x', value: 5 }
]

function onPlayPause() {
    if (store.isPlaying.value) {
        emit('pause')
    } else {
        emit('play')
    }
}

function onStop() {
    emit('stop')
}

function onSeek(v: number | number[] | undefined) {
    if (v === undefined) return
    const val = Array.isArray(v) ? (v[0] ?? 0) : v
    emit('seek', val / 100)
}

function onSpeedChange(v: unknown) {
    emit('speedChange', v as PlaybackSpeed)
}

const formatDistance = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
const formatElevation = (m: number) => `${Math.round(m)}m`
const formatGradient = (pct: number) => `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
    <BottomDrawer :open="open" @update:open="$emit('update:open', $event)">
        <!-- Row 1: Controls -->
        <div class="flex items-center gap-1.5">
            <UButton
                :icon="store.isPlaying.value ? 'i-lucide-pause' : 'i-lucide-play'"
                color="primary"
                class="shrink-0"
                size="sm"
                @click="onPlayPause"
            />

            <UButton
                icon="i-lucide-square"
                color="neutral"
                variant="ghost"
                class="shrink-0"
                size="sm"
                @click="onStop"
            />

            <div class="sim-drawer__slider flex-1 min-w-0">
                <USlider
                    :model-value="sliderProgress"
                    :min="0"
                    :max="100"
                    :step="1"
                    :ui="{
                        track: 'bg-(--secondary-color)',
                        range: 'bg-(--color-surface-soft-strong)'
                    }"
                    @update:model-value="onSeek"
                />
            </div>

            <div class="w-[72px] shrink-0">
                <USelect
                    :model-value="store.playbackSpeed.value"
                    :items="speedItems"
                    size="sm"
                    @update:model-value="onSpeedChange"
                />
            </div>
        </div>

        <!-- Row 2: Info -->
        <div class="flex justify-around gap-2.5 pt-1.5 border-t border-(--ui-border)">
            <div class="flex items-baseline gap-1">
                <span class="text-xs font-semibold text-meta">시간</span>
                <span class="text-xs text-text-base [font-variant-numeric:tabular-nums]">{{
                    formatTime(store.elapsedSeconds.value)
                }}</span>
                <span class="text-xs text-meta">/ {{ formatTime(totalSeconds) }}</span>
            </div>

            <div class="flex items-baseline gap-1">
                <span class="text-xs font-semibold text-meta">거리</span>
                <span class="text-xs text-text-base [font-variant-numeric:tabular-nums]">{{
                    formatDistance(displayInfo.distanceFromStart)
                }}</span>
                <span class="text-xs text-meta"
                    >/ {{ formatDistance(displayInfo.totalDistance) }}</span
                >
            </div>

            <div class="flex items-baseline gap-1">
                <span class="text-xs font-semibold text-meta">고도</span>
                <span class="text-xs text-text-base [font-variant-numeric:tabular-nums]">{{
                    formatElevation(displayInfo.currentElevation)
                }}</span>
            </div>

            <div class="flex items-baseline gap-1">
                <span class="text-xs font-semibold text-meta">경사</span>
                <span
                    class="text-xs [font-variant-numeric:tabular-nums]"
                    :class="{
                        'text-black': displayInfo.currentGradient > 0,
                        'text-[#dfff00]': displayInfo.currentGradient < 0,
                        'text-text-base': displayInfo.currentGradient === 0
                    }"
                    >{{ formatGradient(displayInfo.currentGradient) }}</span
                >
            </div>
        </div>
    </BottomDrawer>
</template>

<style scoped>
.sim-drawer__slider :deep([data-slot='track']) {
    border: 1px solid var(--ui-border);
}
</style>
