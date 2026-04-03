<script setup lang="ts">
/**
 * RouteStatsCard — 경로 통계 카드 (Nuxt UI 기반)
 *
 * Flat 사용:
 *   <RouteStatsCard title="총 거리" value="12.4km" delta="+2.1km" trend="up" icon="i-lucide-route" />
 *
 * Props:
 *   title  — 카드 제목
 *   value  — 주요 수치
 *   delta  — 증감 표시 텍스트 (선택)
 *   trend  — 'up' | 'down' | 'neutral'
 *   icon   — 우측 상단 아이콘 (i-lucide-* 형식)
 */
defineProps<{
    title: string
    value: string | number
    delta?: string
    trend?: 'up' | 'down' | 'neutral'
    icon?: string
}>()
</script>

<template>
    <div class="route-stats-card">
        <div class="route-stats-card__header">
            <span class="route-stats-card__title">{{ title }}</span>
            <UIcon
                v-if="icon"
                :name="icon"
                class="route-stats-card__icon"
            />
        </div>

        <div class="route-stats-card__value">{{ value }}</div>

        <UBadge
            v-if="delta"
            :label="delta"
            :color="trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'neutral'"
            variant="soft"
            size="xs"
            class="route-stats-card__delta"
        />
    </div>
</template>

<style scoped>
.route-stats-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    background: var(--sidebar-item-hover);
    border: 1px solid var(--sidebar-border);
    border-radius: 12px;
    flex: 1;
    min-width: 0;
}

.route-stats-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.route-stats-card__title {
    font-size: 12px;
    font-weight: 500;
    color: var(--sidebar-icon-color);
    letter-spacing: 0.01em;
}

.route-stats-card__icon {
    font-size: 14px;
    color: var(--sidebar-icon-color);
}

.route-stats-card__value {
    font-size: 22px;
    font-weight: 700;
    color: var(--sidebar-icon-hover);
    line-height: 1.1;
}

.route-stats-card__delta {
    align-self: flex-start;
}
</style>
