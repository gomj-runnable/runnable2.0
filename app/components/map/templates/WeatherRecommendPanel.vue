<script setup lang="ts">
import type { RecommendedRoute } from '#shared/types/weather-recommend'
import WeatherRecommendCard from '~/components/map/molecules/WeatherRecommendCard.vue'

defineProps<{
    /** 추천 경로 목록 */
    routes: RecommendedRoute[]
    /** 데이터 로딩 중 여부 */
    isLoading: boolean
}>()

defineEmits<{
    /** 경로 카드 선택 시 routeId 전달 */
    select: [routeId: string]
}>()
</script>

<template>
    <section class="weather-recommend-panel">
        <header class="weather-recommend-panel__header">
            <div class="weather-recommend-panel__title-row">
                <span class="i-lucide-sparkles weather-recommend-panel__icon" />
                <h2 class="weather-recommend-panel__title">오늘의 추천 경로</h2>
            </div>
            <span class="weather-recommend-panel__badge">AI 추천</span>
        </header>

        <div v-if="isLoading" class="weather-recommend-panel__loading">
            <span class="i-lucide-loader-2 weather-recommend-panel__spinner" />
            <span>추천 경로를 불러오는 중...</span>
        </div>

        <ul v-else-if="routes.length > 0" class="weather-recommend-panel__list">
            <li v-for="route in routes" :key="route.routeId">
                <WeatherRecommendCard
                    :route="route"
                    @select="$emit('select', $event)"
                />
            </li>
        </ul>

        <p v-else class="weather-recommend-panel__empty">
            현재 날씨에 맞는 공개 경로가 없습니다.
        </p>
    </section>
</template>

<style scoped src="~/assets/css/components/templates/WeatherRecommendPanel.css"></style>
