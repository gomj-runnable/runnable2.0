<script setup lang="ts">
import type { RouteDiscoverCard } from '#shared/types/discover'
import DiscoverDistrictSelector from '~/components/map/molecules/DiscoverDistrictSelector.vue'
import RouteDiscoverCard from '~/components/map/organizations/cards/RouteDiscoverCard.vue'

defineProps<{
    /** 현재 선택된 구 이름. 선택 없음이면 `null`. */
    selectedDistrict: string | null
    /** 탐색 결과 경로 카드 목록 */
    routes: RouteDiscoverCard[]
    /** 경로 로딩 중 여부 */
    isLoading: boolean
}>()

defineEmits<{
    /** 구역 선택/해제 시 구 이름 또는 `null` 전달 */
    'update:selectedDistrict': [district: string | null]
    /** 경로 카드 클릭 시 경로 ID 전달 */
    selectRoute: [routeId: string]
}>()
</script>

<template>
    <div class="discover-panel">
        <DiscoverDistrictSelector
            :model-value="selectedDistrict"
            @update:model-value="$emit('update:selectedDistrict', $event)"
        />

        <div class="map-section-label">경로 목록</div>

        <div v-if="isLoading" class="discover-panel__empty">불러오는 중...</div>

        <div v-else-if="routes.length === 0" class="discover-panel__empty">
            {{ selectedDistrict ? `${selectedDistrict}에 공개된 경로가 없습니다` : '공개된 경로가 없습니다' }}
        </div>

        <ul v-else class="discover-panel__list">
            <li v-for="route in routes" :key="route.routeId">
                <RouteDiscoverCard
                    :route="route"
                    @select="$emit('selectRoute', $event)"
                />
            </li>
        </ul>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/DiscoverPanel.css"></style>
