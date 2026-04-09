<script setup lang="ts">
import type { RouteBase, SavedRoute } from '#shared/types/route'
import Card from '~/components/map/organizations/cards/Card.vue'
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'

defineProps<{
    routes: SavedRoute[]
    selectedRouteId: string | null
}>()

defineEmits<{
    select: [routeId: string]
    download: [routeId: string]
}>()

const formatDistance = (distance?: RouteBase['distance']) => {
    if (typeof distance !== 'number') return null
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}
</script>

<template>
    <div class="route-list-panel">
        <div class="map-section-label">저장된 경로</div>

        <div v-if="routes.length === 0" class="route-list-panel__empty">저장된 경로가 없습니다</div>

        <ul v-else class="route-list-panel__list">
            <li v-for="route in routes" :key="route.routeId">
                <Card
                    interactive
                    :selected="selectedRouteId === route.routeId"
                    as="article"
                    @click="$emit('select', route.routeId)"
                >
                    <template #header>
                        <div class="route-list-panel__card-header">
                            <h3 class="route-list-panel__card-title">
                                {{ route.title }}
                            </h3>
                            <IconButton
                                icon="i-lucide-download"
                                appearance="secondary"
                                label="경로 다운로드"
                                @click.stop="$emit('download', route.routeId)"
                            />
                        </div>
                    </template>

                    <p v-if="route.description" class="route-list-panel__card-description">
                        {{ route.description }}
                    </p>

                    <template #meta>
                        <span class="route-list-panel__card-meta">
                            {{ formatDistance(route.distance) ?? '' }}
                        </span>
                    </template>
                </Card>
            </li>
        </ul>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/RouteListPanel.css"></style>
