<script setup lang="ts">
import type { CesiumViewer } from '~/composables/useWindow'
import MapShell from '~/components/map/templates/MapShell.vue'
import MapSidebar from '~/components/map/templates/MapSidebar.vue'
import MapSidebarTabs from '~/components/map/templates/MapSidebarTabs.vue'
import DrawRoutePanel from '~/components/map/templates/DrawRoutePanel.vue'
import RouteSaveModal from '~/components/map/templates/RouteSaveModal.vue'
import RouteListPanel from '~/components/map/templates/RouteListPanel.vue'
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'
import SidebarUserProfile from '~/components/map/molecules/profiles/SidebarUserProfile.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'
import { useRouteMapFacade } from '~/composables/useRouteMapFacade'

definePageMeta({ ssr: false })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()
const viewer = shallowRef<CesiumViewer | null>(null)

const {
    searchQuery,
    activeNav,
    filteredRoutes,
    selectedRouteId,
    sectionDraft,
    isRouteSaveModalOpen,
    routeForm,
    routeDistance,
    startDrawing,
    openSaveModal,
    updateSectionAttr,
    removeSection,
    confirmSave,
    selectRoute
} = useRouteMapFacade(viewer)

onMounted(async () => {
    await init()
    viewer.value = window.viewer
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
                                v-model="searchQuery"
                                type="search"
                                placeholder="경로 이름으로 검색"
                                leading-icon="i-lucide-search"
                            />
                            <RouteListPanel
                                :routes="filteredRoutes"
                                :selected-route-id="selectedRouteId"
                                @select="selectRoute"
                            />
                        </template>
                        <DrawRoutePanel
                            v-else-if="activeNav === '그리기'"
                            :section-attrs="sectionDraft?.attrs ?? []"
                            @reset="startDrawing"
                            @save="openSaveModal"
                            @update-section-attr="updateSectionAttr"
                            @remove-section="removeSection"
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
        </MapShell>

        <RouteSaveModal
            :open="isRouteSaveModalOpen"
            :title="routeForm.title"
            :description="routeForm.description"
            :distance="routeDistance"
            @update:open="isRouteSaveModalOpen = $event"
            @update:title="routeForm.title = $event"
            @update:description="routeForm.description = $event"
            @submit="confirmSave"
        />
    </div>
</template>

<style scoped src="~/assets/css/pages/index.css"></style>
