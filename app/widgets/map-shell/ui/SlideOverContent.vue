<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, @typescript-eslint/no-explicit-any */
/**
 * 좌측 SlideOver 패널의 4탭(목록, 그리기, 탐색, 인증) 콘텐츠.
 * facade 객체를 직접 받아 내부에서 바인딩한다.
 */
import { NavKey } from '~/widgets/map-shell/model/nav-key'
import DrawRoutePanel from '~/features/draw-route/ui/DrawRoutePanel.vue'
import RouteListPanel from '~/features/draw-route/ui/RouteListPanel.vue'
import ExplorePanel from '~/features/explore/ui/ExplorePanel.vue'
import AuthSlideOverContent from '~/entities/user/ui/AuthSlideOverContent.vue'
import SectionInfoSlideContent from '~/widgets/right-panel/ui/SectionInfoSlideContent.vue'
import WeatherRecommendPanel from '~/features/weather-overlay/ui/WeatherRecommendPanel.vue'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'

const props = defineProps<{
    isOpen: boolean
    currentNav: string
    title: string
    description: string
    isLoggedIn: boolean
    routeList: any
    currentUserId: string | undefined
    sectionInfo: any
    sectionTotalDistance: number
    sectionTotalTime: number
    sectionDistances: number[]
    drawing: any
    explore: any
    sigunguOptions: unknown[]
    dongOptions: unknown[]
    showRecommend: boolean
    weatherRecommend: any
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'route-select': [routeId: string]
    'route-edit': [routeId: string]
    'explore-select': [routeId: string]
    'explore-import': [routeId: string]
    'step-back': []
    'drawing-start': []
    'toggle-recommend': []
    'auth-success': []
    'auth-logout': []
    'go-login': []
}>()

const authContentRef = ref<InstanceType<typeof AuthSlideOverContent> | null>(null)

watch(
    () => props.currentNav,
    (nav) => {
        if (nav === NavKey.AUTH) authContentRef.value?.reset()
    }
)
</script>

<template>
    <USlideover
        :open="isOpen"
        :title="title"
        :description="description"
        side="left"
        :overlay="false"
        :modal="false"
        :dismissible="false"
        :ui="{ content: 'top-(--ui-header-height)! max-w-[75vw] lg:max-w-sm', header: 'flex!' }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <!-- 목록 (로그인 필요) -->
            <div v-if="currentNav === NavKey.LIST" class="flex flex-col gap-1">
                <div
                    v-if="!isLoggedIn"
                    class="flex flex-col items-center justify-center gap-4 py-12 text-center"
                >
                    <UIcon name="i-lucide-lock" class="size-10 text-[var(--ui-text-dimmed)]" />
                    <p class="text-sm text-[var(--ui-text-muted)]">
                        내 경로 목록을 보려면 로그인이 필요합니다.
                    </p>
                    <UButton label="로그인" color="primary" @click="emit('go-login')" />
                </div>
                <SectionInfoSlideContent
                    v-else-if="sectionInfo.isOpen.value"
                    back-label="경로목록"
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
                        v-model="routeList.searchQuery"
                        type="search"
                        placeholder="경로 이름으로 검색"
                        icon="i-lucide-search"
                    />
                    <RouteListPanel
                        :routes="routeList.filteredRoutes"
                        :selected-route-id="routeList.selectedRouteId"
                        :current-user-id="currentUserId"
                        @select="emit('route-select', $event)"
                        @download="routeList.download"
                        @edit="emit('route-edit', $event)"
                    />
                </template>
            </div>

            <!-- 그리기 -->
            <DrawRoutePanel
                v-else-if="currentNav === NavKey.DRAW"
                :section-attrs="drawing.sectionDraft?.attrs ?? []"
                :section-distances="sectionDistances"
                :section-pois="drawing.sectionPois"
                :active-section-index="drawing.activeSectionIndex"
                @reset="emit('drawing-start')"
                @save="drawing.openSaveModal()"
                @update-section-attr="drawing.updateSectionAttr"
                @remove-section="drawing.removeSection"
                @add-section="drawing.addSection()"
                @remove-poi="drawing.removePoiFromSection($event.sectionIndex, $event.poiIndex)"
                @select-section="drawing.activeSectionIndex = $event.index"
                @import-gpx="drawing.importFromGpxFile"
            />

            <!-- 탐색 -->
            <div v-else-if="currentNav === NavKey.EXPLORE" class="flex flex-col gap-1">
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

            <!-- 로그인 -->
            <AuthSlideOverContent
                v-else-if="currentNav === NavKey.AUTH"
                ref="authContentRef"
                @success="emit('auth-success')"
                @logout="emit('auth-logout')"
            />
        </template>
    </USlideover>
</template>
