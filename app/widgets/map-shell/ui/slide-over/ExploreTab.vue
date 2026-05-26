<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, @typescript-eslint/no-explicit-any */
import ExplorePanel from '~/features/explore/ui/ExplorePanel.vue'
import SectionInfoSlideContent from '~/widgets/map-shell/ui/slide-over/SectionInfoSlideContent.vue'
import WeatherRecommendPanel from '~/features/weather-overlay/ui/WeatherRecommendPanel.vue'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'

defineProps<{
    explore: any
    sectionInfo: any
    sectionTotalDistance: number
    sectionTotalTime: string
    sigunguOptions: string[]
    dongOptions: string[]
    showRecommend: boolean
    weatherRecommend: any
    currentUserId?: string | null
}>()

const emit = defineEmits<{
    'route-select': [routeId: string]
    'explore-select': [routeId: string]
    'explore-import': [routeId: string]
    'step-back': []
    'toggle-recommend': []
}>()
</script>

<template>
    <div class="flex flex-col gap-1">
        <SectionInfoSlideContent
            v-if="sectionInfo.isOpen.value"
            back-label="경로탐색"
            :panel-title="sectionInfo.panelTitle.value"
            :sections="sectionInfo.sections.value"
            :user-paces="sectionInfo.userPaces.value"
            :total-distance="sectionTotalDistance"
            :total-time="sectionTotalTime"
            :is-edit-mode="sectionInfo.isEditMode.value"
            :read-only="sectionInfo.readOnly.value"
            @update:edit-mode="sectionInfo.isEditMode.value = $event"
            @update:pace="sectionInfo.updatePace"
            @update:weight="sectionInfo.updateWeight"
            @update:strategy="sectionInfo.updateStrategy"
            @back="emit('step-back')"
        />
        <template v-else>
            <UInput
                v-model="explore.searchQuery.value"
                type="search"
                placeholder="경로 이름으로 검색"
                icon="i-lucide-search"
                @keyup.enter="explore.search(explore.searchQuery.value)"
            />
            <div class="flex items-center gap-1">
                <USelect
                    :model-value="explore.filter.selectedSigungu.value"
                    :items="sigunguOptions"
                    placeholder="시군구"
                    class="flex-1 min-w-0"
                    @update:model-value="explore.filter.setSigungu($event)"
                />
                <USelect
                    :model-value="explore.filter.selectedDong.value"
                    :items="dongOptions"
                    placeholder="읍면동"
                    class="flex-1 min-w-0"
                    :disabled="explore.filter.selectedSigungu.value === FILTER_ALL"
                    @update:model-value="explore.filter.selectedDong.value = $event"
                />
                <UButton
                    variant="outline"
                    color="neutral"
                    size="sm"
                    icon="i-lucide-rotate-ccw"
                    label="초기화"
                    @click="explore.filter.resetFilters()"
                />
            </div>
            <ExplorePanel
                :routes="explore.filteredResults.value"
                :selected-route-id="explore.selectedRouteId.value"
                :is-loading="explore.isSearching.value"
                :recommend-active="showRecommend"
                :current-user-id="currentUserId"
                @select="emit('explore-select', $event)"
                @import="emit('explore-import', $event)"
                @recommend="emit('toggle-recommend')"
            >
                <template #recommend>
                    <WeatherRecommendPanel
                        :routes="weatherRecommend.recommendedRoutes.value"
                        :is-loading="weatherRecommend.isLoading.value"
                        @select="emit('route-select', $event)"
                    />
                </template>
            </ExplorePanel>
        </template>
    </div>
</template>
