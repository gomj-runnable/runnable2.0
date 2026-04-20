<script setup lang="ts">
import type { RecommendedRoute } from '#shared/types/weather-recommend'

const props = defineProps<{
    /** 추천 경로 데이터 */
    route: RecommendedRoute
}>()

defineEmits<{
    /** 카드 선택 시 routeId 전달 */
    select: [routeId: string]
}>()

/** 거리를 km 단위 문자열로 변환한다 */
const distanceLabel = computed(() => {
    if (!props.route.distance) return null
    return `${(props.route.distance / 1000).toFixed(1)}km`
})

/** 고도차 레이블을 반환한다 */
const elevationLabel = computed(() => {
    if (props.route.highHeight == null || props.route.lowHeight == null) return null
    const diff = props.route.highHeight - props.route.lowHeight
    return `고도차 ${diff}m`
})

/** 점수에 따른 색상 클래스를 반환한다 */
const scoreColorClass = computed(() => {
    if (props.route.score >= 80) return 'is-score-good'
    if (props.route.score >= 50) return 'is-score-moderate'
    return 'is-score-low'
})
</script>

<template>
    <button type="button" class="weather-recommend-card" @click="$emit('select', route.routeId)">
        <div class="weather-recommend-card__header">
            <span class="weather-recommend-card__title">{{ route.title }}</span>
            <span class="weather-recommend-card__score" :class="scoreColorClass">
                {{ route.score }}점
            </span>
        </div>

        <div class="weather-recommend-card__score-bar">
            <div
                class="weather-recommend-card__score-fill"
                :class="scoreColorClass"
                :style="{ width: `${route.score}%` }"
            />
        </div>

        <div v-if="distanceLabel || elevationLabel" class="weather-recommend-card__meta">
            <span v-if="distanceLabel" class="weather-recommend-card__meta-item">
                <span class="i-lucide-map-pin" />
                {{ distanceLabel }}
            </span>
            <span v-if="elevationLabel" class="weather-recommend-card__meta-item">
                <span class="i-lucide-mountain" />
                {{ elevationLabel }}
            </span>
        </div>

        <div v-if="route.tags.length > 0" class="weather-recommend-card__tags">
            <span v-for="tag in route.tags" :key="tag" class="weather-recommend-card__tag">
                {{ tag }}
            </span>
        </div>
    </button>
</template>

<style scoped src="./WeatherRecommendCard.css"></style>
