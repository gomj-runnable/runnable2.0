<script setup lang="ts">
import type { RouteCompareItem, RouteCompareResponse } from '#shared/types/route-compare'
import {
    ROUTE_COMPARE_COLOR_A,
    ROUTE_COMPARE_COLOR_B
} from '~/features/route-compare/lib/useRouteCompareOverlay'

const props = defineProps<{
    /** `/api/routes/compare` 응답 (null 이면 패널 미표시) */
    result: RouteCompareResponse | null
}>()

interface MetricRow {
    label: string
    valueA: string
    valueB: string
}

const formatKm = (km: number) => `${km.toFixed(2)} km`
const formatMeters = (m: number) => `${Math.round(m)} m`
const formatDurationMin = (min: number) => {
    const total = Math.max(0, Math.round(min))
    const h = Math.floor(total / 60)
    const m = total % 60
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`
}
const sumFacilities = (counts: Record<string, number>) =>
    Object.values(counts).reduce((acc, n) => acc + n, 0)

const buildMetricRows = (a: RouteCompareItem, b: RouteCompareItem): MetricRow[] => [
    { label: '거리', valueA: formatKm(a.meta.distanceKm), valueB: formatKm(b.meta.distanceKm) },
    {
        label: '누적 상승',
        valueA: formatMeters(a.meta.ascentM),
        valueB: formatMeters(b.meta.ascentM)
    },
    {
        label: '예상 시간',
        valueA: formatDurationMin(a.meta.estimatedDurationMin),
        valueB: formatDurationMin(b.meta.estimatedDurationMin)
    },
    {
        label: '시설물',
        valueA: `${sumFacilities(a.meta.facilityCounts)}개`,
        valueB: `${sumFacilities(b.meta.facilityCounts)}개`
    }
]

const rows = computed(() =>
    props.result ? buildMetricRows(props.result.routeA, props.result.routeB) : []
)
</script>

<template>
    <section v-if="result" class="route-compare-panel">
        <header class="grid grid-cols-2 gap-3 mb-3">
            <article class="flex items-center gap-2">
                <span class="dot" :style="{ backgroundColor: ROUTE_COMPARE_COLOR_A }" />
                <strong class="title">{{ result.routeA.route.title }}</strong>
            </article>
            <article class="flex items-center gap-2">
                <span class="dot" :style="{ backgroundColor: ROUTE_COMPARE_COLOR_B }" />
                <strong class="title">{{ result.routeB.route.title }}</strong>
            </article>
        </header>

        <table class="metric-table">
            <thead>
                <tr>
                    <th class="label">지표</th>
                    <th>A</th>
                    <th>B</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="row.label">
                    <td class="label">{{ row.label }}</td>
                    <td>{{ row.valueA }}</td>
                    <td>{{ row.valueB }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</template>

<style scoped>
.route-compare-panel {
    padding: 16px;
    border-radius: 16px;
    background: var(--ui-bg-elevated);
    border: 1px solid var(--ui-border);
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex-shrink: 0;
}

.title {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
}

.metric-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.metric-table th,
.metric-table td {
    padding: 8px 10px;
    text-align: right;
    border-top: 1px solid var(--ui-border);
}

.metric-table thead th {
    color: var(--ui-text-muted);
    font-weight: 500;
    border-top: none;
}

.metric-table .label {
    text-align: left;
    color: var(--ui-text-muted);
    font-weight: 500;
}

@media (max-width: 540px) {
    .metric-table th,
    .metric-table td {
        padding: 6px 8px;
    }
}
</style>
