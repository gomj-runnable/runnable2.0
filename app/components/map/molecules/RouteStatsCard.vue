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
            <UIcon v-if="icon" :name="icon" class="route-stats-card__icon" />
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

<style scoped src="~/assets/css/components/map/molecules/RouteStatsCard.css"></style>
