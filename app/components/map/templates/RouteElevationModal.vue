<script setup lang="ts">
import type { RouteElevationProfile } from '#shared/types/route'
import Button from '~/components/map/molecules/buttons/Button.vue'
import PopupModal from '~/components/map/templates/PopupModal.vue'
import { createDistanceTicks } from '~/composables/action/useRouteElevationProfile'
import { calcChartGeometry } from '~/composables/action/useElevationChartAction'

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

/** 거리 값을 m/km 단위 문자열로 변환한다 */
const formatDistance = (distanceKm?: number) => {
    if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) {
        return '0.0km'
    }

    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`
}

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
        { label: '총 거리', value: formatDistance(props.profile.distanceKm) },
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
    <PopupModal
        :open="open && !!profile"
        popup-id="popup-route-elevation"
        aria-labelledby="popup-title-route-elevation"
        position="bottom"
        panel-class="route-elevation-modal__popup-panel"
        @update:open="$emit('update:open', $event)"
    >
        <section v-if="profile" class="route-elevation-modal route-elevation-modal__panel">
            <header class="route-elevation-modal__header">
                <div>
                    <p class="route-elevation-modal__eyebrow">Elevation Profile</p>
                    <h2 id="popup-title-route-elevation" class="route-elevation-modal__title">
                        {{ title }}
                    </h2>
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
                            {{ formatTickLabel(tick.value) }}
                        </text>
                    </g>
                </svg>
            </div>

            <footer class="route-elevation-modal__footer">
                <span>섹션별 선 색상은 지도 구간 색상과 동일합니다.</span>
                <span>500m 간격 눈금과 최고·최저 고도를 함께 표시합니다.</span>
            </footer>
        </section>
    </PopupModal>
</template>

<style scoped src="~/assets/css/components/templates/RouteElevationModal.css"></style>
