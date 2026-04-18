<script setup lang="ts">
defineProps<{
    /** 다른 범례(날씨/고도)가 표시 중인지 여부 */
    hasOtherLegend?: boolean
}>()
</script>

<template>
    <div
        class="gradient-legend"
        :class="{ 'gradient-legend--stacked': hasOtherLegend }"
    >
        <p class="gradient-legend__title">경사도</p>
        <div class="gradient-legend__list">
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #4CAF50" />
                완만 (0~3%)
            </div>
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #FFC107" />
                약간 가파름 (3~7%)
            </div>
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #FF9800" />
                가파름 (7~12%)
            </div>
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #F44336" />
                매우 가파름 (12%+)
            </div>
        </div>
    </div>
</template>

<style scoped>
.gradient-legend {
    position: absolute;
    bottom: var(--gap-section-lg);
    left: var(--gap-section-lg);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-surface-md);
    padding: var(--gap-section-xs) var(--gap-section-sm);
    backdrop-filter: var(--blur);
    box-shadow: var(--shadow-sm);
    min-width: 140px;
    pointer-events: auto;
    z-index: 4;
}

.gradient-legend--stacked {
    bottom: calc(var(--gap-section-lg) + 48px);
}

.gradient-legend__title {
    font-size: var(--text-caption);
    color: var(--text-muted);
    margin-bottom: var(--gap-2);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.gradient-legend__list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-1);
}

.gradient-legend__item {
    display: flex;
    align-items: center;
    gap: var(--gap-2);
    font-size: var(--text-caption);
    color: var(--text-secondary);
}

.gradient-legend__swatch {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-control-sm);
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
}
</style>
