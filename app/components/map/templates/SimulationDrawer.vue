<script setup lang="ts">
import type { PlaybackSpeed } from '#shared/types/simulation'
import BottomDrawer from '~/components/map/molecules/BottomDrawer.vue'
import { useSimulationStore } from '~/composables/store/useSimulationStore'

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
const displayInfo = computed(() => store.progressInfo.value ?? {
    distanceFromStart: 0,
    totalDistance: 0,
    currentElevation: 0,
    currentGradient: 0,
    progress: 0
})

const speedItems = [
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '5x', value: 5 },
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
    const val = Array.isArray(v) ? v[0] ?? 0 : v
    emit('seek', val / 100)
}

function onSpeedChange(v: unknown) {
    emit('speedChange', v as PlaybackSpeed)
}

const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
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
    <BottomDrawer
        :open="open"
        @update:open="$emit('update:open', $event)"
    >
        <!-- Row 1: Controls -->
        <div class="sim-drawer__controls">
            <button
                class="sim-drawer__btn sim-drawer__btn--play"
                @click="onPlayPause"
            >
                <UIcon
                    :name="store.isPlaying.value ? 'i-lucide-pause' : 'i-lucide-play'"
                    class="sim-drawer__btn-icon"
                />
            </button>

            <button
                class="sim-drawer__btn sim-drawer__btn--stop"
                @click="onStop"
            >
                <UIcon name="i-lucide-square" class="sim-drawer__btn-icon" />
            </button>

            <div class="sim-drawer__slider">
                <USlider
                    :model-value="sliderProgress"
                    :min="0"
                    :max="100"
                    :step="1"
                    :ui="{ track: 'bg-(--secondary-color)', range: 'bg-(--color-surface-soft-strong)' }"
                    @update:model-value="onSeek"
                />
            </div>

            <div class="sim-drawer__speed">
                <USelect
                    :model-value="store.playbackSpeed.value"
                    :items="speedItems"
                    size="sm"
                    @update:model-value="onSpeedChange"
                />
            </div>
        </div>

        <!-- Row 2: Info -->
        <div class="sim-drawer__info">
            <div class="sim-drawer__info-item">
                <span class="sim-drawer__info-label">시간</span>
                <span class="sim-drawer__info-value">{{ formatTime(store.elapsedSeconds.value) }}</span>
                <span class="sim-drawer__info-total">/ {{ formatTime(totalSeconds) }}</span>
            </div>

            <div class="sim-drawer__info-item">
                <span class="sim-drawer__info-label">거리</span>
                <span class="sim-drawer__info-value">{{ formatDistance(displayInfo.distanceFromStart) }}</span>
                <span class="sim-drawer__info-total">/ {{ formatDistance(displayInfo.totalDistance) }}</span>
            </div>

            <div class="sim-drawer__info-item">
                <span class="sim-drawer__info-label">고도</span>
                <span class="sim-drawer__info-value">{{ formatElevation(displayInfo.currentElevation) }}</span>
            </div>

            <div class="sim-drawer__info-item">
                <span class="sim-drawer__info-label">경사</span>
                <span
                    class="sim-drawer__info-value"
                    :class="{
                        'is-uphill': displayInfo.currentGradient > 0,
                        'is-downhill': displayInfo.currentGradient < 0,
                    }"
                >{{ formatGradient(displayInfo.currentGradient) }}</span>
            </div>
        </div>
    </BottomDrawer>
</template>

<style scoped>
.sim-drawer__controls {
    display: flex;
    align-items: center;
    gap: var(--gap-2);
}

.sim-drawer__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size-control-lg);
    height: var(--size-control-lg);
    border: none;
    border-radius: var(--radius-control-sm);
    background: var(--color-surface-soft-strong);
    color: var(--text-primary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast);
}

.sim-drawer__btn:hover {
    background: var(--surface-hover);
}

.sim-drawer__btn--play {
    background: var(--secondary-color);
    color: var(--text-on-primary);
}

.sim-drawer__btn--play:hover {
    background: var(--primary-color);
}

.sim-drawer__btn--stop {
    background: var(--color-surface-soft);
    color: var(--text-secondary);
}

.sim-drawer__btn--stop:hover {
    background: var(--color-surface-soft-strong);
}

.sim-drawer__btn-icon {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
}

.sim-drawer__slider {
    flex: 1;
    min-width: 0;
}

.sim-drawer__slider :deep([data-slot="track"]) {
    border: 1px solid var(--color-border-subtle);
}

.sim-drawer__speed {
    width: 72px;
    flex-shrink: 0;
}

.sim-drawer__info {
    display: flex;
    justify-content: space-around;
    gap: var(--gap-3);
    padding-top: var(--gap-2);
    border-top: 1px solid var(--color-border-subtle);
}

.sim-drawer__info-item {
    display: flex;
    align-items: baseline;
    gap: var(--gap-1);
}

.sim-drawer__info-label {
    font-size: var(--text-label-xs);
    font-weight: 600;
    color: var(--text-muted);
}

.sim-drawer__info-value {
    font-size: var(--text-label-xs);
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
}

.sim-drawer__info-total {
    font-size: var(--text-label-xs);
    color: var(--text-muted);
}

.sim-drawer__info-value.is-uphill {
    color: var(--fourth-color);
}

.sim-drawer__info-value.is-downhill {
    color: var(--third-color);
}
</style>
