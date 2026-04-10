<script setup lang="ts">
import type { RouteBase, SavedRoute } from '#shared/types/route'
import Card from '~/components/map/organizations/cards/Card.vue'

defineProps<{
    routes: SavedRoute[]
    selectedRouteId: string | null
    isLoading: boolean
}>()

defineEmits<{
    select: [routeId: string]
}>()

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
