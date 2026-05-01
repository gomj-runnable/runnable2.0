<script setup lang="ts">
import type { RouteElevationProfile } from '#shared/types/route'
import { createDistanceTicks } from '~/entities/route/lib/useRouteElevationProfile'
import { calcChartGeometry } from '~/features/elevation-layer/lib/useElevationChartAction'
import { formatDistance } from '~/shared/lib/useFormatUtils'

const CHART_WIDTH = 720
const CHART_HEIGHT = 260
const CHART_PADDING = {
    top: 24,
    right: 20,
    bottom: 40,
    left: 20
}

const CHART_DIMENSIONS = {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    padding: CHART_PADDING
}

const props = defineProps<{
    /** 팝업 표시 여부 */
    open: boolean
    /** 모달 헤더에 표시할 경로 제목 */
    title: string
    /** 표시할 고도 프로필 데이터 (없으면 팝업 미표시) */
    profile: RouteElevationProfile | null
}>()

defineEmits<{
    /** 팝업 열림/닫힘 상태 변경 시 새 상태 값을 전달 */
    'update:open': [value: boolean]
}>()

/** 고도 값을 m 단위 문자열로 변환한다 (유효하지 않으면 '-' 반환) */
const formatElevation = (elevation?: number) =>
    typeof elevation === 'number' && !Number.isNaN(elevation) ? `${Math.round(elevation)}m` : '-'

/** 거리 눈금 값을 표시용 문자열로 변환한다 */
const formatTickLabel = (km: number) => {
    if (km === 0) return '0'
    if (km < 1) return `${Math.round(km * 1000)}m`
    return Number.isInteger(km) ? `${km}km` : `${km.toFixed(1)}km`
}

/** 요약 카드에 표시할 총 거리·최고·최저 고도 항목 목록을 반환한다 */
const summaryItems = computed(() => {
    if (!props.profile) {
        return []
    }

    return [
        { label: '총 거리', value: formatDistance(props.profile.distanceKm, '0.0km') },
        { label: '최고 고도', value: formatElevation(props.profile.maxElevation) },
        { label: '최저 고도', value: formatElevation(props.profile.minElevation) }
    ]
})

/** 고도 SVG 차트 렌더링에 필요한 좌표·경로 기하 데이터를 계산한다 */
const chartGeometry = computed(() => {
    if (!props.profile) {
        return null
    }

    // 거리 눈금 생성 후 차트 기하 계산
    return calcChartGeometry(
        props.profile,
        createDistanceTicks(props.profile.distanceKm),
        CHART_DIMENSIONS
    )
})
</script>

<template>
    <UModal
        :open="open && !!profile"
        :title="title"
        description="Elevation Profile"
        @update:open="$emit('update:open', $event)"
    >
        <template #body>
            <div v-if="profile" class="w-[min(820px,100%)] bg-(--ui-bg-elevated) rounded-3xl">

            <div class="grid grid-cols-3 gap-2.5 mb-3 max-[540px]:grid-cols-1">
                <article
                    v-for="item in summaryItems"
                    :key="item.label"
                    class="flex flex-col gap-1 p-3 border border-(--ui-border) rounded-2xl bg-(--ui-bg-elevated)"
                >
                    <span class="text-xs text-(--ui-text-muted)">{{ item.label }}</span>
                    <strong class="text-[0.9375rem] font-semibold">{{ item.value }}</strong>
                </article>
            </div>

            <div class="overflow-hidden border border-(--ui-border) rounded-2xl bg-(--ui-bg-elevated)">
                <div class="flex items-center justify-between gap-3 px-3 pt-3 flex-wrap">
                    <div class="flex gap-1.5 flex-wrap justify-end">
                        <span
                            v-for="section in profile.sections"
                            :key="`${section.label}-${section.startIndex}`"
                            class="inline-flex items-center gap-1 px-2.5 py-1 border border-(--ui-border) rounded-full bg-(--ui-bg-elevated) text-xs text-(--ui-text-dimmed)"
                        >
                            <span
                                class="w-2 h-2 rounded-full"
                                :style="{ backgroundColor: section.color }"
                            />
                            {{ section.label }}
                        </span>
                    </div>
                </div>

                <svg
                    v-if="chartGeometry"
                    :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
                    class="block w-full h-auto"
                >
                    <defs>
                        <linearGradient id="route-elevation-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#ffe09b" stop-opacity="0.28" />
                            <stop offset="100%" stop-color="#ffe09b" stop-opacity="0.02" />
                        </linearGradient>
                    </defs>

                    <g>
                        <line
                            v-for="tick in chartGeometry.distanceTicks"
                            :key="tick.value"
                            :x1="tick.x"
                            :x2="tick.x"
                            y1="24"
                            :y2="chartGeometry.baselineY"
                            class="elevation-grid-line"
                        />
                    </g>

                    <path
                        :d="chartGeometry.areaPath"
                        fill="url(#route-elevation-gradient)"
                    />

                    <path
                        v-for="section in chartGeometry.sectionSegments"
                        :key="`${section.label}-${section.startIndex}`"
                        :d="section.path"
                        class="elevation-line"
                        :style="{ stroke: section.color }"
                    />

                    <g
                        v-if="chartGeometry.highestPoint"
                        :transform="`translate(${chartGeometry.highestPoint.x}, ${chartGeometry.highestPoint.y})`"
                        class="elevation-marker elevation-marker--highest"
                    >
                        <rect x="-8" y="-8" width="16" height="16" rx="8" />
                        <path d="M -3 0 L -0.5 3 L 4 -3" />
                    </g>
                    <g
                        v-if="chartGeometry.lowestPoint"
                        :transform="`translate(${chartGeometry.lowestPoint.x}, ${chartGeometry.lowestPoint.y})`"
                        class="elevation-marker elevation-marker--lowest"
                    >
                        <rect x="-8" y="-8" width="16" height="16" rx="8" />
                        <path d="M -3 0 L -0.5 3 L 4 -3" />
                    </g>

                    <g v-if="chartGeometry.highestPoint">
                        <text
                            :x="chartGeometry.highestPoint.x"
                            :y="chartGeometry.highestPoint.y - 12"
                            text-anchor="middle"
                            class="elevation-marker-label elevation-marker-label--highest"
                        >
                            최고 {{ formatElevation(profile.maxElevation) }}
                        </text>
                    </g>

                    <g v-if="chartGeometry.lowestPoint">
                        <text
                            :x="chartGeometry.lowestPoint.x"
                            :y="chartGeometry.lowestPoint.y + 22"
                            text-anchor="middle"
                            class="elevation-marker-label elevation-marker-label--lowest"
                        >
                            최저 {{ formatElevation(profile.minElevation) }}
                        </text>
                    </g>

                    <g
                        v-for="tick in chartGeometry.distanceTicks"
                        :key="`label-${tick.value}`"
                    >
                        <text
                            :x="tick.x"
                            :y="CHART_HEIGHT - 8"
                            text-anchor="middle"
                            class="elevation-tick-label"
                        >
                            {{ formatTickLabel(tick.value) }}
                        </text>
                    </g>
                </svg>
            </div>

            <footer class="flex justify-between gap-2.5 mt-3 text-xs text-(--ui-text-muted) max-[720px]:flex-col">
                <span>섹션별 선 색상은 지도 구간 색상과 동일합니다.</span>
                <span>500m 간격 눈금과 최고·최저 고도를 함께 표시합니다.</span>
            </footer>

            </div>
        </template>
    </UModal>
</template>

<style scoped>
.elevation-grid-line { stroke: rgb(255 255 255 / 0.08); stroke-width: 1; }
.elevation-line { fill: none; stroke: #f1c25b; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.elevation-marker rect { stroke-width: 2; }
.elevation-marker path { fill: none; stroke: #09111a; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.2; }
.elevation-marker--highest rect { fill: #fff2b8; stroke: #f7c948; }
.elevation-marker--lowest rect { fill: #cfe9ff; stroke: #57b9ff; }
.elevation-marker-label { font-size: 12px; font-weight: 700; }
.elevation-marker-label--highest { fill: #fff2b8; }
.elevation-marker-label--lowest { fill: #cfe9ff; }
.elevation-tick-label { fill: rgb(255 255 255 / 0.58); font-size: 12px; font-weight: 600; }
</style>
