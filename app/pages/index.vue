<script setup lang="ts">
import type { DrawActionData, MapPrimeEntity, MapPrimeViewer } from '~/composables/useWindow'
import type { CreateSectionSchema, SectionAttrSchema } from '#shared/schemas/route.schema'
import { RouteDraftBuilder, createSectionSchema } from '#shared/schemas/route.schema'
import MapShell from '~/components/map/templates/MapShell.vue'
import MapSidebar from '~/components/map/templates/MapSidebar.vue'
import MapSidebarTabs from '~/components/map/templates/MapSidebarTabs.vue'
import DrawRoutePanel from '~/components/map/templates/DrawRoutePanel.vue'
import RouteSaveModal from '~/components/map/templates/RouteSaveModal.vue'
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'
import SidebarUserProfile from '~/components/map/molecules/profiles/SidebarUserProfile.vue'
import Textfield from '~/components/map/atoms/inputs/Textfield.vue'

definePageMeta({ ssr: false })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

const { init } = useMapInit()
const viewer = shallowRef<MapPrimeViewer | null>(null)

onMounted(async () => {
    await init()
    viewer.value = window.viewer
})

const searchQuery = ref('')
const activeNav = ref('목록')
const drawnPositions = ref<unknown[] | null>(null)
const drawMetrics = ref<DrawActionData | null>(null)
const sectionDraft = ref<CreateSectionSchema | null>(null)
const drawnPolyline = shallowRef<MapPrimeEntity | null>(null)
const isRouteSaveModalOpen = ref(false)
const routeForm = ref({
    title: '',
    description: ''
})

const routeDistance = computed(() => new RouteDraftBuilder(drawMetrics.value).getDistance())

const createDefaultSectionAttr = (index: number): SectionAttrSchema => ({
    seq: index,
    name: undefined,
    comment: undefined,
    description: undefined
})

const toSectionGeom = (positions: unknown[], wgs84Array?: number[][]) =>
    JSON.stringify({
        type: 'LineString',
        coordinates: wgs84Array?.length ? wgs84Array : positions
    })

const _createPolyline = (positions: unknown): MapPrimeEntity | null => {
    if (!viewer.value) {
        return null
    }

    return viewer.value._createEntity('polyline', {
        positions,
        width: 8,
        clampToGround: false,
        color: '#57B9FF',
        opacity: 0.95
    })
}

const handleRouteModalOpenChange = (open: boolean) => {
    isRouteSaveModalOpen.value = open
}

const handleRouteTitleChange = (title: string) => {
    routeForm.value.title = title
}

const handleRouteDescriptionChange = (description: string) => {
    routeForm.value.description = description
}

const handleDrawReset = async () => {
    if (!viewer.value) {
        alert('지도를 아직 불러오는 중입니다.')
        return
    }

    viewer.value._removeGraphic(drawnPolyline.value)
    drawnPolyline.value = null
    drawnPositions.value = null
    drawMetrics.value = null
    sectionDraft.value = null
    isRouteSaveModalOpen.value = false
    routeForm.value = {
        title: '',
        description: ''
    }

    alert('좌클릭: 구간 추가\n우클릭: 완료')

    const result = await viewer.value._drawAction({
        shapeType: 1,
        showLabel: true
    })

    if (!result || !('data' in result) || !result.data) {
        if (result && 'message' in result && result.message) {
            alert(result.message)
        }
        return
    }

    const data = result?.data
    const positions = data?.positions
    if (!Array.isArray(positions) || positions.length === 0) {
        return
    }

    drawMetrics.value = data ?? null
    drawnPositions.value = positions
    sectionDraft.value = createSectionSchema.parse({
        routeId: 'draft-route',
        geom: toSectionGeom(positions, data?.wgs84Array),
        attrs: positions.map((_, index) => createDefaultSectionAttr(index))
    })
    drawnPolyline.value = _createPolyline(positions)
}

const handleDrawSave = () => {
    if (!drawnPositions.value || drawnPositions.value.length === 0 || !sectionDraft.value) {
        alert('먼저 구간을 그려주세요.')
        return
    }

    sectionDraft.value = createSectionSchema.parse(sectionDraft.value)
    isRouteSaveModalOpen.value = true
}

const handleRouteSaveSubmit = () => {
    if (!sectionDraft.value) {
        alert('먼저 구간을 그려주세요.')
        return
    }

    try {
        const routeBuilder = new RouteDraftBuilder(drawMetrics.value)
        const routePayload = routeBuilder.toRoute(routeForm.value)
        const sectionPayload = createSectionSchema.parse(sectionDraft.value)

        console.log({
            route: routePayload,
            section: sectionPayload
        })

        isRouteSaveModalOpen.value = false
        alert('저장')
    } catch (error) {
        alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    }
}

const handleUpdateSectionAttr = ({
    index,
    field,
    value
}: {
    index: number
    field: 'name' | 'comment' | 'description'
    value: string
}) => {
    if (!sectionDraft.value) {
        return
    }

    const attrs = [...(sectionDraft.value.attrs ?? [])]
    const currentAttr = attrs[index] ?? createDefaultSectionAttr(index)
    attrs[index] = {
        ...currentAttr,
        [field]: value || undefined
    }

    sectionDraft.value = {
        ...sectionDraft.value,
        attrs
    }
}

const navItems = [
    { icon: 'i-lucide-list', label: '목록' },
    { icon: 'i-lucide-pencil', label: '그리기' },
    { icon: 'i-lucide-users', label: '친구' }
] as const

watch(activeNav, async (nextNav, prevNav) => {
    if (nextNav !== '그리기' || prevNav === '그리기') {
        return
    }

    await nextTick()
    await handleDrawReset()
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
                        <div class="map-section-label">경로 검색</div>
                        <Textfield
                            v-model="searchQuery"
                            type="search"
                            placeholder="경로 이름으로 검색"
                            leading-icon="i-lucide-search"
                        />
                    </template>
                    <DrawRoutePanel
                        v-else-if="activeNav === '그리기'"
                        :section-attrs="sectionDraft?.attrs ?? []"
                        @reset="handleDrawReset"
                        @save="handleDrawSave"
                        @update-section-attr="handleUpdateSectionAttr"
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
