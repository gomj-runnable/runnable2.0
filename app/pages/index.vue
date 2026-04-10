<script setup lang="ts">
import type { CesiumViewer } from '~/composables/useWindow'
import MapShell from '~/components/map/templates/MapShell.vue'
import MapSidebar from '~/components/map/templates/MapSidebar.vue'
import MapSidebarTabs from '~/components/map/templates/MapSidebarTabs.vue'
import DrawRoutePanel from '~/components/map/templates/DrawRoutePanel.vue'
import RouteElevationModal from '~/components/map/templates/RouteElevationModal.vue'
import RouteSaveModal from '~/components/map/templates/RouteSaveModal.vue'
import RouteFeedbackModal from '~/components/map/templates/RouteFeedbackModal.vue'
import RouteListPanel from '~/components/map/templates/RouteListPanel.vue'
import WeatherOverlay from '~/components/map/templates/WeatherOverlay.vue'
import FacilityOverlay from '~/components/map/templates/FacilityOverlay.vue'
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'
import SidebarUserProfile from '~/components/map/molecules/profiles/SidebarUserProfile.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'
import { useRouteMapFacade } from '~/composables/useRouteMapFacade'
import { useWeatherStore } from '~/composables/store/useWeatherStore'
import { useWeatherSideeffect } from '~/composables/sideeffect/useWeatherSideeffect'
import { useFacilityStore } from '~/composables/store/useFacilityStore'
import { useFacilitySideeffect } from '~/composables/sideeffect/useFacilitySideeffect'

definePageMeta({ ssr: false })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()
const viewer = shallowRef<CesiumViewer | null>(null)

const { activeNav, drawing, saveModal, routeList, elevationChart, feedback } =
    useRouteMapFacade(viewer)

const weather = useWeatherStore()
const { init: initWeather } = useWeatherSideeffect({ viewer, ...weather })

const facility = useFacilityStore()
useFacilitySideeffect({ viewer, ...facility })

onMounted(async () => {
    await init()
    viewer.value = window.viewer
    await initWeather()
})

const navItems = [
    { icon: 'i-lucide-list', label: '목록' },
    { icon: 'i-lucide-pencil', label: '그리기' },
    { icon: 'i-lucide-users', label: '친구' }
] as const
</script>

<template>
    <div class="index-page">
        <MapShell>
            <template #sidebar="{ collapsed, toggleSidebar }">
                <MapSidebar :collapsed="collapsed">
                    <template #header>
                        <IconButton v-if="!collapsed" icon="i-lucide-map-pin" label="Runnable" />
                        <div
                            class="sidebar-header-actions"
                            :class="{ 'sidebar-header-actions--collapsed': collapsed }"
                        >
                            <IconButton
                                :icon="
                                    collapsed
                                        ? 'i-lucide-panel-left-open'
                                        : 'i-lucide-panel-left-close'
                                "
                                @click="toggleSidebar"
                            />
                        </div>
                    </template>

                    <template #subheader>
                        <MapSidebarTabs
                            v-model="activeNav"
                            :items="navItems"
                            :collapsed="collapsed"
                        />
                    </template>

                    <template #default>
                        <template v-if="activeNav === '목록'">
                            <Textfield
                                v-model="routeList.searchQuery"
                                type="search"
                                placeholder="경로 이름으로 검색"
                                leading-icon="i-lucide-search"
                            />
                            <RouteListPanel
                                :routes="routeList.filteredRoutes"
                                :selected-route-id="routeList.selectedRouteId"
                                @select="routeList.select"
                                @download="routeList.download"
                            />
                        </template>
                        <DrawRoutePanel
                            v-else-if="activeNav === '그리기'"
                            :section-attrs="drawing.sectionDraft?.attrs ?? []"
                            @reset="drawing.start"
                            @save="drawing.openSaveModal"
                            @update-section-attr="drawing.updateSectionAttr"
                            @remove-section="drawing.removeSection"
                        />
                    </template>

                    <template #footer>
                        <SidebarUserProfile @click="() => {}" />
                    </template>
                </MapSidebar>
            </template>

            <template #default>
                <div id="map" class="map-view" />
            </template>

            <template #overlay>
                <WeatherOverlay
                    :selected-date="weather.selectedDate.value"
                    :selected-hour="weather.selectedHour.value"
                    :selected-month="weather.selectedMonth.value"
                    :active-layer="weather.activeLayer.value"
                    :monthly-data="weather.monthlyData.value"
                    :is-loading="weather.isLoading.value"
                    @update:selected-date="weather.selectedDate.value = $event"
                    @update:selected-hour="weather.selectedHour.value = $event"
                    @update:selected-month="weather.selectedMonth.value = $event"
                    @update:active-layer="weather.activeLayer.value = $event"
                />
                <FacilityOverlay
                    :active-types="facility.activeTypes.value"
                    :is-loading="facility.isLoading.value"
                    @toggle="facility.toggleType"
                />
                <RouteElevationModal
                    :open="elevationChart.open"
                    :title="elevationChart.title"
                    :profile="elevationChart.profile"
                    @update:open="elevationChart.setOpen($event)"
                />
            </template>
        </MapShell>

        <RouteSaveModal
            :open="saveModal.open"
            :title="saveModal.routeForm.title"
            :description="saveModal.routeForm.description"
            :distance="saveModal.routeDistance"
            @update:open="saveModal.open = $event"
            @update:title="saveModal.routeForm.title = $event"
            @update:description="saveModal.routeForm.description = $event"
            @submit="saveModal.confirm"
        />
        <RouteFeedbackModal
            :open="feedback.open"
            :title="feedback.title"
            :message="feedback.message"
            :tone="feedback.tone"
            @update:open="feedback.close()"
        />
    </div>
</template>

<style scoped src="~/assets/css/pages/index.css"></style>
