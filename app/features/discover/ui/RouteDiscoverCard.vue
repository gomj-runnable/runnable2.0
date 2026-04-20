<script setup lang="ts">
import type { RouteDiscoverCard } from '#shared/types/discover'
import Card from '~/shared/ui/cards/Card.vue'
import { formatDistance } from '~/shared/lib/useFormatUtils'

defineProps<{
    /** 경로 카드 데이터 */
    route: RouteDiscoverCard
    /** 선택 상태 여부 */
    selected?: boolean
}>()

defineEmits<{
    /** 카드 클릭 시 경로 ID를 전달 */
    select: [routeId: string]
}>()

/**
 * 고도 범위 문자열을 반환한다.
 * @param high - 최고 고도 (meters)
 * @param low - 최저 고도 (meters)
 */
const formatElevation = (high?: number, low?: number): string => {
    if (high == null && low == null) return ''
    if (high != null && low != null) return `${Math.round(low)}–${Math.round(high)}m`
    if (high != null) return `최고 ${Math.round(high)}m`
    if (low != null) return `최저 ${Math.round(low)}m`
    return ''
}
</script>

<template>
    <Card interactive :selected="selected" as="article" @click="$emit('select', route.routeId)">
        <template #header>
            <div class="route-discover-card__header">
                <h3 class="route-discover-card__title">{{ route.title }}</h3>
                <span v-if="route.districts?.length" class="route-discover-card__district">
                    {{ route.districts.join(' · ') }}
                </span>
            </div>
        </template>

        <div class="route-discover-card__stats">
            <span v-if="route.distance" class="route-discover-card__stat">
                {{ formatDistance(route.distance) }}
            </span>
            <span
                v-if="formatElevation(route.highHeight, route.lowHeight)"
                class="route-discover-card__stat"
            >
                {{ formatElevation(route.highHeight, route.lowHeight) }}
            </span>
        </div>

        <template #meta>
            <span v-if="route.authorName" class="route-discover-card__author">
                {{ route.authorName }}
            </span>
        </template>
    </Card>
</template>

<style scoped src="./RouteDiscoverCard.css"></style>
