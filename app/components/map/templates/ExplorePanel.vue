<script setup lang="ts">
import type { RouteBase, SavedRoute } from '#shared/types/route'
import Card from '~/components/map/organizations/cards/Card.vue'

defineProps<{
    /** 공개 경로 목록 */
    routes: SavedRoute[]
    /** 현재 선택된 경로 ID (없으면 null) */
    selectedRouteId: string | null
    /** 경로 로딩 중 여부 */
    isLoading: boolean
}>()

defineEmits<{
    /** 경로 카드 클릭 시 선택된 경로 ID를 전달 */
    select: [routeId: string]
}>()

/** 거리 값을 m/km 단위 문자열로 변환한다 */
const formatDistance = (distance?: RouteBase['distance']) => {
    if (typeof distance !== 'number') return null
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}
</script>

<template>
    <div class="explore-panel">
        <div class="map-section-label">공개 경로</div>

        <div v-if="isLoading" class="explore-panel__empty">검색 중...</div>

        <div v-else-if="routes.length === 0" class="explore-panel__empty">
            검색 결과가 없습니다
        </div>

        <ul v-else class="explore-panel__list">
            <li v-for="route in routes" :key="route.routeId">
                <Card
                    interactive
                    :selected="selectedRouteId === route.routeId"
                    as="article"
                    @click="$emit('select', route.routeId)"
                >
                    <template #header>
                        <div class="explore-panel__card-header">
                            <h3 class="explore-panel__card-title">
                                {{ route.title }}
                            </h3>
                            <span v-if="route.authorName" class="explore-panel__card-author">
                                {{ route.authorName }}
                            </span>
                        </div>
                    </template>

                    <p v-if="route.description" class="explore-panel__card-description">
                        {{ route.description }}
                    </p>

                    <template #meta>
                        <span class="explore-panel__card-meta">
                            {{ formatDistance(route.distance) ?? '' }}
                        </span>
                    </template>
                </Card>
            </li>
        </ul>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/ExplorePanel.css"></style>
