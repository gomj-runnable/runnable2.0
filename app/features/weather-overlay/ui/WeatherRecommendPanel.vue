<script setup lang="ts">
import type { RecommendedRoute } from '#shared/types/weather-recommend'
import WeatherRecommendCard from '~/entities/weather/ui/WeatherRecommendCard.vue'

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
    <section class="flex flex-col gap-2.5 w-full">
        <header class="flex items-center justify-between gap-2.5">
            <div class="flex items-center gap-1.5">
                <span class="i-lucide-sparkles text-base text-(--ui-primary)" />
                <h2 class="m-0 text-sm font-semibold text-text-base">오늘의 추천 경로</h2>
            </div>
            <span
                class="px-1.5 py-[2px] rounded-lg bg-(--ui-primary)/10 text-(--ui-primary) text-xs font-bold whitespace-nowrap"
                >AI 추천</span
            >
        </header>

        <div v-if="isLoading" class="flex items-center gap-1.5 py-3 text-sm text-(--ui-text-muted)">
            <span class="i-lucide-loader-2 animate-spin" />
            <span>추천 경로를 불러오는 중...</span>
        </div>

        <ul v-else-if="routes.length > 0" class="flex flex-col gap-1.5 list-none m-0 p-0">
            <li v-for="route in routes" :key="route.routeId">
                <WeatherRecommendCard :route="route" @select="$emit('select', $event)" />
            </li>
        </ul>

        <p v-else class="m-0 py-3 text-sm text-(--ui-text-muted) text-center">
            현재 날씨에 맞는 공개 경로가 없습니다.
        </p>
    </section>
</template>
