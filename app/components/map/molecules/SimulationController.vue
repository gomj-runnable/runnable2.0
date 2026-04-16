<script setup lang="ts">
import type { PlaybackSpeed } from '#shared/types/simulation'
import { useSimulationStore } from '~/composables/store/useSimulationStore'

/**
 * 3D 시뮬레이션 재생 컨트롤러 컴포넌트.
 * 재생/일시정지/정지 버튼, 진행 바(클릭 가능), 속도 선택, 진행 정보를 표시한다.
 * 활성 상태(재생 또는 일시정지)일 때만 렌더링된다.
 */
const emit = defineEmits<{
    play: []
    pause: []
    stop: []
    seek: [progress: number]
    speedChange: [speed: PlaybackSpeed]
}>()

const store = useSimulationStore()

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 2, 5]

/** 진행 바 클릭 → seek 이벤트 발행 */
const onProgressBarClick = (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLElement
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    emit('seek', ratio)
}

/** 거리를 "X.Xkm" 또는 "Xm" 형식으로 포맷한다. */
const formatDistance = (meters: number): string => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`
    return `${Math.round(meters)}m`
}

/** 고도를 소수점 없이 표시한다. */
const formatElevation = (meters: number): string => `${Math.round(meters)}m`

/** 경사도를 소수점 1자리로 표시한다. */
const formatGradient = (pct: number): string => {
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct.toFixed(1)}%`
}
</script>

<template>
    <Transition name="sim-ctrl">
        <div v-if="store.isActive.value" class="sim-ctrl">
            <!-- 상단: 컨트롤 버튼 + 진행 바 + 속도 -->
            <div class="sim-ctrl__row sim-ctrl__row--controls">
                <!-- 정지 버튼 -->
                <button
                    class="sim-ctrl__btn sim-ctrl__btn--stop"
                    title="정지"
                    @click="emit('stop')"
                >
                    <span class="sim-ctrl__icon">■</span>
                </button>

                <!-- 재생 / 일시정지 토글 버튼 -->
                <button
                    class="sim-ctrl__btn sim-ctrl__btn--play"
                    :title="store.isPlaying.value ? '일시정지' : '재생'"
                    @click="store.isPlaying.value ? emit('pause') : emit('play')"
                >
                    <span class="sim-ctrl__icon">{{ store.isPlaying.value ? '⏸' : '▶' }}</span>
                </button>

                <!-- 진행 바 -->
                <div
                    class="sim-ctrl__progress-bar"
                    role="slider"
                    :aria-valuenow="Math.round(store.progress.value * 100)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="재생 위치"
                    @click="onProgressBarClick"
                >
                    <div
                        class="sim-ctrl__progress-fill"
                        :style="{ width: `${store.progress.value * 100}%` }"
                    />
                </div>

                <!-- 속도 선택 -->
                <div class="sim-ctrl__speeds">
                    <button
                        v-for="speed in SPEED_OPTIONS"
                        :key="speed"
                        class="sim-ctrl__speed-btn"
                        :class="{ 'is-active': store.playbackSpeed.value === speed }"
                        @click="emit('speedChange', speed)"
                    >
                        {{ speed }}x
                    </button>
                </div>
            </div>

            <!-- 하단: 거리 · 고도 · 경사도 정보 -->
            <div v-if="store.progressInfo.value" class="sim-ctrl__row sim-ctrl__row--info">
                <span class="sim-ctrl__info-item">
                    <span class="sim-ctrl__info-label">거리</span>
                    <span class="sim-ctrl__info-value">
                        {{ formatDistance(store.progressInfo.value.distanceFromStart) }}
                        <span class="sim-ctrl__info-total">/ {{ formatDistance(store.progressInfo.value.totalDistance) }}</span>
                    </span>
                </span>
                <span class="sim-ctrl__info-divider" aria-hidden="true" />
                <span class="sim-ctrl__info-item">
                    <span class="sim-ctrl__info-label">고도</span>
                    <span class="sim-ctrl__info-value">{{ formatElevation(store.progressInfo.value.currentElevation) }}</span>
                </span>
                <span class="sim-ctrl__info-divider" aria-hidden="true" />
                <span class="sim-ctrl__info-item">
                    <span class="sim-ctrl__info-label">경사</span>
                    <span
                        class="sim-ctrl__info-value"
                        :class="{
                            'is-uphill': store.progressInfo.value.currentGradient > 0,
                            'is-downhill': store.progressInfo.value.currentGradient < 0
                        }"
                    >
                        {{ formatGradient(store.progressInfo.value.currentGradient) }}
                    </span>
                </span>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* ──────────────────────────────────────────────
   컨테이너
────────────────────────────────────────────── */
.sim-ctrl {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px;
    background: color-mix(in srgb, var(--color-surface-default) 85%, transparent);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    border-radius: var(--radius-surface-md);
    border: 1px solid color-mix(in srgb, var(--color-border-default) 60%, transparent);
    min-width: 320px;
    user-select: none;
}

/* ──────────────────────────────────────────────
   행 레이아웃
────────────────────────────────────────────── */
.sim-ctrl__row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sim-ctrl__row--info {
    gap: 12px;
    padding-top: 6px;
    border-top: 1px solid color-mix(in srgb, var(--color-border-default) 40%, transparent);
}

/* ──────────────────────────────────────────────
   컨트롤 버튼
────────────────────────────────────────────── */
.sim-ctrl__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-surface-sm);
    background: var(--color-surface-raised);
    color: var(--color-text-default);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
}

.sim-ctrl__btn:hover {
    background: var(--color-surface-hover);
}

.sim-ctrl__btn--play {
    background: var(--color-primary-default);
    color: var(--color-on-primary);
}

.sim-ctrl__btn--play:hover {
    background: var(--color-primary-hover);
}

.sim-ctrl__icon {
    font-size: 14px;
    line-height: 1;
}

/* ──────────────────────────────────────────────
   진행 바
────────────────────────────────────────────── */
.sim-ctrl__progress-bar {
    flex: 1;
    height: 6px;
    background: var(--color-surface-raised);
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.sim-ctrl__progress-fill {
    height: 100%;
    background: var(--color-primary-default);
    border-radius: 3px;
    transition: width 0.1s linear;
}

/* ──────────────────────────────────────────────
   속도 선택
────────────────────────────────────────────── */
.sim-ctrl__speeds {
    display: flex;
    gap: 4px;
}

.sim-ctrl__speed-btn {
    padding: 2px 8px;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-surface-sm);
    background: transparent;
    color: var(--color-text-subtle);
    font-size: var(--text-caption);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.sim-ctrl__speed-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-default);
}

.sim-ctrl__speed-btn.is-active {
    background: var(--color-primary-default);
    border-color: var(--color-primary-default);
    color: var(--color-on-primary);
}

/* ──────────────────────────────────────────────
   진행 정보
────────────────────────────────────────────── */
.sim-ctrl__info-item {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.sim-ctrl__info-label {
    font-size: var(--text-caption);
    color: var(--color-text-subtle);
}

.sim-ctrl__info-value {
    font-size: var(--text-body-sm);
    color: var(--color-text-default);
    font-variant-numeric: tabular-nums;
}

.sim-ctrl__info-total {
    font-size: var(--text-caption);
    color: var(--color-text-subtle);
}

.sim-ctrl__info-value.is-uphill {
    color: var(--color-status-warning);
}

.sim-ctrl__info-value.is-downhill {
    color: var(--color-status-info);
}

.sim-ctrl__info-divider {
    width: 1px;
    height: 14px;
    background: color-mix(in srgb, var(--color-border-default) 60%, transparent);
    flex-shrink: 0;
}

/* ──────────────────────────────────────────────
   진입/퇴장 트랜지션
────────────────────────────────────────────── */
.sim-ctrl-enter-active,
.sim-ctrl-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.sim-ctrl-enter-from,
.sim-ctrl-leave-to {
    opacity: 0;
    transform: translateY(8px);
}
</style>
