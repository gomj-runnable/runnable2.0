<script setup lang="ts">
import type { RouteElevationPoint, RouteElevationProfile } from '#shared/types/route'
import Button from '~/components/map/molecules/buttons/Button.vue'
import { createDistanceTicks } from '~/composables/action/useRouteElevationProfile'

const CHART_WIDTH = 720
const CHART_HEIGHT = 260
const CHART_PADDING = {
    top: 24,
    right: 20,
    bottom: 40,
    left: 20
}

const props = defineProps<{
    open: boolean
    title: string
    profile: RouteElevationProfile | null
}>()

defineEmits<{
    'update:open': [value: boolean]
}>()

const formatDistance = (distanceKm?: number) => {
    if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) {
        return '0.0km'
    }

    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`
}

const formatElevation = (elevation?: number) =>
    typeof elevation === 'number' && !Number.isNaN(elevation) ? `${Math.round(elevation)}m` : '-'

type RenderedPoint = RouteElevationPoint & { x: number; y: number }
type RenderedSectionSegment = RouteElevationProfile['sections'][number] & { path: string }

const findRenderedPoint = (
    linePoints: RenderedPoint[],
    target: RouteElevationPoint
) =>
    linePoints.find(
        (point) =>
            point.distanceKm === target.distanceKm && point.elevation === target.elevation
    ) ?? null

const summaryItems = computed(() => {
    if (!props.profile) {
        return []
    }

    return [
        { label: '총 거리', value: formatDistance(props.profile.distanceKm) },
        { label: '최고 고도', value: formatElevation(props.profile.maxElevation) },
        { label: '최저 고도', value: formatElevation(props.profile.minElevation) },
        { label: '상승', value: formatElevation(props.profile.elevationGain) },
        { label: '하강', value: formatElevation(props.profile.elevationLoss) }
    ]
})

const chartGeometry = computed(() => {
    const points = props.profile?.points ?? []

    if (points.length === 0 || !props.profile) {
        return null
    }

    const chartWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
    const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
    const maxDistance = Math.max(props.profile.distanceKm, 0.001)
    const minElevation = Math.min(...points.map((point) => point.elevation))
    const maxElevation = Math.max(...points.map((point) => point.elevation))
    const elevationRange = Math.max(maxElevation - minElevation, 1)
    const elevationPadding = Math.max(elevationRange * 0.18, 12)
    const lowerBound = minElevation - elevationPadding
    const upperBound = maxElevation + elevationPadding
    const scaleX = (distanceKm: number) =>
        CHART_PADDING.left + (distanceKm / maxDistance) * chartWidth
    const scaleY = (elevation: number) =>
        CHART_PADDING.top + ((upperBound - elevation) / (upperBound - lowerBound)) * chartHeight
    const linePoints: RenderedPoint[] = points.map((point) => ({
        x: Number(scaleX(point.distanceKm).toFixed(2)),
        y: Number(scaleY(point.elevation).toFixed(2)),
        distanceKm: point.distanceKm,
        elevation: point.elevation
    }))
    const linePath = linePoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')
    const baselineY = CHART_PADDING.top + chartHeight
    const areaPath = `${linePath} L ${linePoints.at(-1)?.x ?? CHART_PADDING.left} ${baselineY} L ${linePoints[0]?.x ?? CHART_PADDING.left} ${baselineY} Z`
    const distanceTicks = createDistanceTicks(props.profile.distanceKm).map((distanceKm) => ({
        value: distanceKm,
        x: Number(scaleX(distanceKm).toFixed(2))
    }))
    const sectionSegments = props.profile.sections
        .map((section) => {
            const sectionPoints = linePoints.slice(section.startIndex, section.endIndex + 1)

            if (sectionPoints.length < 2) {
                return null
            }

            return {
                ...section,
                path: sectionPoints
                    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                    .join(' ')
            }
        })
        .filter((section): section is RenderedSectionSegment => section !== null)

    return {
        baselineY,
        distanceTicks,
        linePoints,
        areaPath,
        sectionSegments,
        highestPoint: findRenderedPoint(linePoints, props.profile.highestPoint),
        lowestPoint: findRenderedPoint(linePoints, props.profile.lowestPoint)
    }
})
</script>

<template>
    <div
        v-if="open && profile"
        class="route-elevation-modal"
        role="dialog"
        aria-modal="true"
        aria-label="경로 고도 그래프"
        @click.self="$emit('update:open', false)"
    >
        <section class="route-elevation-modal__panel">
            <header class="route-elevation-modal__header">
                <div>
                    <p class="route-elevation-modal__eyebrow">Elevation Profile</p>
                    <h2 class="route-elevation-modal__title">{{ title }}</h2>
                </div>
                <Button
                    appearance="secondary"
                    size="sm"
                    icon="i-lucide-x"
                    @click="$emit('update:open', false)"
                />
            </header>

            <div class="route-elevation-modal__summary">
                <article
                    v-for="item in summaryItems"
                    :key="item.label"
                    class="route-elevation-modal__summary-card"
                >
                    <span class="route-elevation-modal__summary-label">{{ item.label }}</span>
                    <strong class="route-elevation-modal__summary-value">{{ item.value }}</strong>
                </article>
            </div>

            <div class="route-elevation-modal__chart">
                <div class="route-elevation-modal__legend">
                    <span class="route-elevation-modal__legend-stat route-elevation-modal__legend-stat--up">
                        상승 {{ formatElevation(profile.elevationGain) }}
                    </span>
                    <span class="route-elevation-modal__legend-stat route-elevation-modal__legend-stat--down">
                        하강 {{ formatElevation(profile.elevationLoss) }}
                    </span>

                    <div class="route-elevation-modal__section-legend">
                        <span
                            v-for="section in profile.sections"
                            :key="`${section.label}-${section.startIndex}`"
                            class="route-elevation-modal__section-chip"
                        >
                            <span
                                class="route-elevation-modal__section-swatch"
                                :style="{ backgroundColor: section.color }"
                            />
                            {{ section.label }}
                        </span>
                    </div>
                </div>

                <svg
                    v-if="chartGeometry"
                    :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
                    class="route-elevation-modal__svg"
                >
                    <defs>
                        <linearGradient
                            id="route-elevation-gradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
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
                            class="route-elevation-modal__grid-line"
                        />
                    </g>

                    <path
                        :d="chartGeometry.areaPath"
                        class="route-elevation-modal__area"
                        fill="url(#route-elevation-gradient)"
                    />

                    <path
                        v-for="section in chartGeometry.sectionSegments"
                        :key="`${section.label}-${section.startIndex}`"
                        :d="section.path"
                        class="route-elevation-modal__line"
                        :style="{ stroke: section.color }"
                    />

                    <g
                        v-if="chartGeometry.highestPoint"
                        :transform="`translate(${chartGeometry.highestPoint.x}, ${chartGeometry.highestPoint.y})`"
                        class="route-elevation-modal__marker route-elevation-modal__marker--highest"
                    >
                        <rect x="-8" y="-8" width="16" height="16" rx="8" />
                        <path d="M -3 0 L -0.5 3 L 4 -3" />
                    </g>
                    <g
                        v-if="chartGeometry.lowestPoint"
                        :transform="`translate(${chartGeometry.lowestPoint.x}, ${chartGeometry.lowestPoint.y})`"
                        class="route-elevation-modal__marker route-elevation-modal__marker--lowest"
                    >
                        <rect x="-8" y="-8" width="16" height="16" rx="8" />
                        <path d="M -3 0 L -0.5 3 L 4 -3" />
                    </g>

                    <g v-if="chartGeometry.highestPoint">
                        <text
                            :x="chartGeometry.highestPoint.x"
                            :y="chartGeometry.highestPoint.y - 12"
                            text-anchor="middle"
                            class="route-elevation-modal__marker-label route-elevation-modal__marker-label--highest"
                        >
                            최고 {{ formatElevation(profile.maxElevation) }}
                        </text>
                    </g>

                    <g v-if="chartGeometry.lowestPoint">
                        <text
                            :x="chartGeometry.lowestPoint.x"
                            :y="chartGeometry.lowestPoint.y + 22"
                            text-anchor="middle"
                            class="route-elevation-modal__marker-label route-elevation-modal__marker-label--lowest"
                        >
                            최저 {{ formatElevation(profile.minElevation) }}
                        </text>
                    </g>

                    <g
                        v-for="tick in chartGeometry.distanceTicks"
                        :key="`label-${tick.value}`"
                        class="route-elevation-modal__axis"
                    >
                        <text
                            :x="tick.x"
                            :y="CHART_HEIGHT - 8"
                            text-anchor="middle"
                            class="route-elevation-modal__tick-label"
                        >
                            {{ tick.value.toFixed(1) }}km
                        </text>
                    </g>
                </svg>
            </div>

            <footer class="route-elevation-modal__footer">
                <span>섹션별 선 색상은 지도 구간 색상과 동일합니다.</span>
                <span>0.5km 간격 눈금과 최고·최저 고도를 함께 표시합니다.</span>
            </footer>
        </section>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/RouteElevationModal.css"></style>
