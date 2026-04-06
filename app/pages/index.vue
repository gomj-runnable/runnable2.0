<script setup lang="ts">
import type { MapPrimeViewer } from '~/composables/useWindow'
import { RouteDraftBuilder, createSectionSchema } from '#shared/schemas/route.schema'
import MapShell from '~/components/map/templates/MapShell.vue'
import MapSidebar from '~/components/map/templates/MapSidebar.vue'
import MapSidebarTabs from '~/components/map/templates/MapSidebarTabs.vue'
import DrawRoutePanel from '~/components/map/templates/DrawRoutePanel.vue'
import RouteSaveModal from '~/components/map/templates/RouteSaveModal.vue'
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'
import SidebarUserProfile from '~/components/map/molecules/profiles/SidebarUserProfile.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'
import { useRouteDrawStore } from '~/composables/store/useRouteDrawStore'
import useRouteDrawSideeffect from '~/composables/sideeffect/useRouteDrawSideeffect'
import { useRouteSaveSideeffect } from '~/composables/sideeffect/useRouteSaveSideeffect'
import { useRouteListSideeffect } from '~/composables/sideeffect/useRouteListSideeffect'
import RouteListPanel from '~/components/map/templates/RouteListPanel.vue'

definePageMeta({ ssr: false })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()
const viewer = shallowRef<MapPrimeViewer | null>(null)
const routeDrawStore = useRouteDrawStore()
const {
    searchQuery,
    activeNav,
    routes,
    selectedRouteId,
    drawMetrics,
    sectionDraft,
    isRouteSaveModalOpen,
    routeForm,
    routeDistance
} = routeDrawStore
const { saveRoute } = useRouteSaveSideeffect()
const { fetchRoutes, selectRoute, clearPreview } = useRouteListSideeffect({
    viewer,
    routes,
    selectedRouteId
})

const filteredRoutes = computed(() =>
    routes.value.filter((r) => r.title.includes(searchQuery.value))
)
const { handleDrawReset, handleDrawSave, handleUpdateSectionAttr, handleRemoveSection } =
    useRouteDrawSideeffect({
        viewer,
        drawnPositions: routeDrawStore.drawnPositions,
        drawMetrics: routeDrawStore.drawMetrics,
        sectionDraft: routeDrawStore.sectionDraft,
        sectionPointRanges: routeDrawStore.sectionPointRanges,
        isRouteSaveModalOpen: routeDrawStore.isRouteSaveModalOpen,
        resetRouteDrawState: routeDrawStore.resetRouteDrawState
    })

onMounted(async () => {
    await init()
    viewer.value = window.viewer
    await fetchRoutes()
})

const handleRouteModalOpenChange = (open: boolean) => {
    isRouteSaveModalOpen.value = open
}

const handleRouteTitleChange = (title: string) => {
    routeForm.value.title = title
}

const handleRouteDescriptionChange = (description: string) => {
    routeForm.value.description = description
}

const handleRouteSaveSubmit = async () => {
    if (!sectionDraft.value) {
        alert('먼저 구간을 그려주세요.')
        return
    }

    try {
        const routePayload = new RouteDraftBuilder(drawMetrics.value).toRoute(routeForm.value)
        const sectionPayload = createSectionSchema.parse(sectionDraft.value)

        await saveRoute(routePayload, sectionPayload)
        await fetchRoutes()

        isRouteSaveModalOpen.value = false
        routeDrawStore.resetRouteDrawState()
        alert('저장되었습니다.')
    } catch (error) {
        alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    }
}

const navItems = [
    { icon: 'i-lucide-list', label: '목록' },
    { icon: 'i-lucide-pencil', label: '그리기' },
    { icon: 'i-lucide-users', label: '친구' }
] as const

watch(activeNav, async (nextNav, prevNav) => {
    if (nextNav === '그리기' && prevNav !== '그리기') {
        clearPreview()
        selectedRouteId.value = null
        await nextTick()
        await handleDrawReset()
    }
})
</script>

<template>
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
                                collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'
                            "
                            @click="toggleSidebar"
                        />
                    </div>
                </template>

                <template #subheader>
                    <MapSidebarTabs v-model="activeNav" :items="navItems" :collapsed="collapsed" />
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
                        @reset="handleDrawReset"
                        @save="handleDrawSave"
                        @update-section-attr="handleUpdateSectionAttr"
                        @remove-section="handleRemoveSection"
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
        @update:open="handleRouteModalOpenChange"
        @update:title="handleRouteTitleChange"
        @update:description="handleRouteDescriptionChange"
        @submit="handleRouteSaveSubmit"
    />
</template>

<style scoped src="~/assets/css/pages/index.css"></style>
