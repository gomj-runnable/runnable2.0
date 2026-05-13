<script setup lang="ts">
import type { RouteStats, MonthlyRouteStat } from '#shared/types/stats'

const props = defineProps<{
    stats: RouteStats
    isLoading?: boolean
}>()

const summaryItems = computed(() => [
    { label: '총 경로 수', value: `${props.stats.routeCount}개` },
    { label: '총 거리', value: `${props.stats.totalDistanceKm.toFixed(1)} km` },
    { label: '총 고도차', value: `${props.stats.totalElevationChangeM.toLocaleString()} m` }
])

// 최근 6개월만 표시
const chartData = computed<MonthlyRouteStat[]>(() => {
    return props.stats.monthlyStats.slice(-6)
})

const maxCount = computed(() => Math.max(...chartData.value.map((m) => m.count), 1))

const CHART_H = 80
const BAR_W = 24
const BAR_GAP = 8

function barHeight(count: number): number {
    return Math.round((count / maxCount.value) * CHART_H)
}

function barX(index: number): number {
    return index * (BAR_W + BAR_GAP)
}

const chartWidth = computed(() => chartData.value.length * (BAR_W + BAR_GAP) - BAR_GAP)

function shortMonth(ym: string): string {
    const [, m] = ym.split('-')
    return `${Number(m)}월`
}
</script>

<template>
    <div class="flex flex-col gap-4 p-4">
        <div v-if="isLoading" class="text-sm text-[var(--ui-text-muted)] text-center py-6">
            통계를 불러오는 중…
        </div>

        <template v-else>
            <!-- 요약 카드 -->
            <div class="grid grid-cols-3 gap-3">
                <div
                    v-for="item in summaryItems"
                    :key="item.label"
                    class="flex flex-col items-center gap-1 rounded-lg bg-[var(--ui-bg-elevated)] p-3"
                >
                    <span class="text-xs text-[var(--ui-text-muted)]">{{ item.label }}</span>
                    <span class="text-base font-semibold text-[var(--ui-text-highlighted)]">{{
                        item.value
                    }}</span>
                </div>
            </div>

            <!-- 월별 경로 수 막대 차트 -->
            <div v-if="chartData.length > 0" class="flex flex-col gap-2">
                <p class="text-xs font-medium text-[var(--ui-text-muted)]">월별 경로 수</p>
                <svg
                    :width="chartWidth"
                    :height="CHART_H + 20"
                    class="overflow-visible"
                    :viewBox="`0 0 ${chartWidth} ${CHART_H + 20}`"
                >
                    <g v-for="(m, i) in chartData" :key="m.month">
                        <rect
                            :x="barX(i)"
                            :y="CHART_H - barHeight(m.count)"
                            :width="BAR_W"
                            :height="barHeight(m.count)"
                            rx="3"
                            class="fill-[var(--ui-primary)]"
                            :opacity="i === chartData.length - 1 ? 1 : 0.6"
                        />
                        <text
                            :x="barX(i) + BAR_W / 2"
                            :y="CHART_H + 14"
                            text-anchor="middle"
                            class="fill-[var(--ui-text-muted)]"
                            font-size="10"
                        >
                            {{ shortMonth(m.month) }}
                        </text>
                        <text
                            v-if="m.count > 0"
                            :x="barX(i) + BAR_W / 2"
                            :y="CHART_H - barHeight(m.count) - 4"
                            text-anchor="middle"
                            class="fill-[var(--ui-text-highlighted)]"
                            font-size="10"
                            font-weight="600"
                        >
                            {{ m.count }}
                        </text>
                    </g>
                </svg>
            </div>

            <p v-else class="text-sm text-[var(--ui-text-muted)] text-center py-4">
                저장된 경로가 없습니다.
            </p>
        </template>
    </div>
</template>
