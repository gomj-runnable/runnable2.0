<script setup lang="ts">
import type { SavedRoute } from '#shared/types/route'
import Card from '~/components/map/organizations/cards/Card.vue'

defineProps<{
    routes: SavedRoute[]
    selectedRouteId: string | null
}>()

defineEmits<{
    select: [routeId: string]
}>()

const formatDistance = (distance?: number) => {
    if (typeof distance !== 'number') return null
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}
</script>

<template>
    <div class="route-list-panel">
        <div class="map-section-label">저장된 경로</div>

        <div v-if="routes.length === 0" class="route-list-panel__empty">
            저장된 경로가 없습니다
        </div>

        <ul v-else class="route-list-panel__list">
            <li v-for="route in routes" :key="route.routeId">
                <Card
                    :title="route.title"
                    :description="route.description"
                    :meta="formatDistance(route.distance) ?? undefined"
                    interactive
                    :selected="selectedRouteId === route.routeId"
                    as="article"
                    @click="$emit('select', route.routeId)"
                />
            </li>
        </ul>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/RouteListPanel.css"></style>
