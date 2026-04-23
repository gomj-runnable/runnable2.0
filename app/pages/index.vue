<script setup lang="ts">
/**
 * 러닝 경로 제작 서비스의 메인 페이지.
 *
 * Cesium 3D 지도 위에서 경로 그리기·저장·목록 조회·탐색·날씨·편의시설 기능을 제공한다.
 * 사이드바(목록·그리기·탐색 탭)와 지도 오버레이(날씨·편의시설·고도 차트·경로 닫기 칩)로 구성되며,
 * `useRouteMapFacade`를 통해 드로잉·저장·목록 로직을 단일 진입점으로 사용한다.
 */
import type { CesiumViewer } from '~/shared/lib/useWindow'
import MapShell from '~/widgets/map-shell/ui/MapShell.vue'
import MapSidebar from '~/widgets/map-shell/ui/MapSidebar.vue'
import MapSidebarTabs from '~/widgets/map-shell/ui/MapSidebarTabs.vue'
import DrawRoutePanel from '~/features/draw-route/ui/DrawRoutePanel.vue'
import RouteElevationModal from '~/features/draw-route/ui/RouteElevationModal.vue'
import RouteOverlayBottomBar from '~/features/draw-route/ui/RouteOverlayBottomBar.vue'
import RouteSaveModal from '~/features/draw-route/ui/RouteSaveModal.vue'
import RouteListPanel from '~/features/draw-route/ui/RouteListPanel.vue'
import WeatherOverlay from '~/features/weather-overlay/ui/WeatherOverlay.vue'
import FacilityOverlay from '~/widgets/facility-overlay/ui/FacilityOverlay.vue'
import GradientLegend from '~/entities/gradient/ui/GradientLegend.vue'
import ExplorePanel from '~/features/explore/ui/ExplorePanel.vue'
import SidebarUserProfile from '~/entities/user/ui/SidebarUserProfile.vue'
import AuthModal from '~/entities/user/ui/AuthModal.vue'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useRouteMapFacade } from '~/widgets/map-shell/model/useRouteMapFacade'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import {
    findNearestSection,
    validatePoiDistance,
    generatePoiComment
} from '~/entities/route/lib/usePoiSnapping'
import { useWeatherStore } from '~/entities/weather/model/useWeatherStore'
import { useWeatherSideeffect } from '~/features/weather-overlay/api/useWeatherSideeffect'
import { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import { useFacilitySideeffect } from '~/entities/facility/api/useFacilitySideeffect'
import { useSidewalkSideeffect } from '~/entities/facility/api/useSidewalkSideeffect'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'
import { useCameraStore } from '~/features/camera/model/useCameraStore'
import { useCameraSideeffect } from '~/features/camera/api/useCameraSideeffect'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { useBoundarySideeffect } from '~/entities/boundary/api/useBoundarySideeffect'
import MapFooter from '~/widgets/map-shell/ui/MapFooter.vue'
import SecondPanel from '~/widgets/right-panel/ui/SecondPanel.vue'
import { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'
import {
    calculateTotalDistance,
    calculateTotalTime,
    formatTime
} from '~/entities/route/lib/usePaceCalculator'
import { useElevationLayerStore } from '~/features/elevation-layer/model/useElevationLayerStore'
import { useElevationLayerSideeffect } from '~/features/elevation-layer/api/useElevationLayerSideeffect'
import { useGradientStore } from '~/entities/gradient/model/useGradientStore'
import { useGradientSideeffect } from '~/entities/gradient/api/useGradientSideeffect'
import { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'
import { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import { useSimulationStore } from '~/features/simulation/model/useSimulationStore'
import { useSimulationSideeffect } from '~/features/simulation/api/useSimulationSideeffect'
import { useWeatherRecommendStore } from '~/entities/weather/model/useWeatherRecommendStore'
import { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'
import { useWeatherRecommendSideeffect } from '~/features/weather-overlay/api/useWeatherRecommendSideeffect'
import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'
import { useMapInit } from '~/shared/lib/map/useMapInit'
import { useDistrictStore } from '~/entities/boundary/model/useDistrictStore'
import RouteInfoInputForm from '~/entities/route/ui/RouteInfoInputForm.vue'
import RouteInfoMarkerPopup from '~/entities/route/ui/RouteInfoMarkerPopup.vue'
import SimulationDrawer from '~/features/simulation/ui/SimulationDrawer.vue'
import WeatherRecommendPanel from '~/features/weather-overlay/ui/WeatherRecommendPanel.vue'

/** 브라우저 전용 페이지 — Cesium 뷰어가 window 객체에 의존하므로 SSR을 비활성화한다. */
definePageMeta({ ssr: false })

useHead({
    link: [{ rel: 'stylesheet', href: '/lib/cesium/Widgets/widgets.css' }]
})

// ─── 지도 초기화 ─────────────────────────────────────────────────

const notification = useNotificationStore()

const toast = useToast()

const { init } = useMapInit({
    onBuildingCorrected: () => {
        toast.add({
            title: '위치 보정',
            description: '건물 위를 선택하여 인근 지면으로 위치가 보정되었습니다.',
            icon: 'i-lucide-info',
            color: 'info'
        })
    }
})
/** Cesium 뷰어 인스턴스. `onMounted` 이후 `window.viewer`로 할당된다. */
const viewer = shallowRef<CesiumViewer | null>(null)

// ─── 경로정보 ────────────────────────────────────────────────────

const routeInfoStore = useRouteInfoStore()
const routeInfoEffect = useRouteInfoSideeffect(viewer)

// ─── 경로 Facade (그리기·저장·목록·고도·닫기) ────────────────────

const {
    activeNav,
    drawing,
    saveModal,
    routeList,
    elevationChart,
    closing,
    exploreSelectRoute,
    hideRoutePolylines,
    showRoutePolylines,
    showRouteInfoGuide
} = useRouteMapFacade(viewer, {
    onAfterSave: async (routeId) => {
        await routeInfoEffect.saveLocalRouteInfos(routeId)
    }
})

const routeDrawStore = useRouteDrawStore()

// ─── 인증 ────────────────────────────────────────────────────────

const authStore = useAuthStore()
const authEffect = useAuthSideeffect()

// ─── 날씨·편의시설 ───────────────────────────────────────────────

const weather = useWeatherStore()
const { init: initWeather } = useWeatherSideeffect({ viewer, ...weather })

const facility = useFacilityStore()
const facilityEffect = useFacilitySideeffect({
    viewer,
    ...facility,
    onPoiClick: (poi) => {
        // 드로잉 상태가 아니면 무시
        if (!drawing.sectionDraft) return

        const ranges = routeDrawStore.sectionPointRanges.value
        const positions = routeDrawStore.drawnPositions.value
        if (!positions?.length || !ranges.length) return

        // 구간별 좌표 추출
        const sectionGeometries = ranges.map((range) => ({
            geom: {
                coordinates: positions.slice(range.start, range.end + 1)
            }
        }))

        const result = findNearestSection(poi.geom, sectionGeometries)
        if (!result) return

        const status = validatePoiDistance(result.distanceMeters)

        if (status === 'blocked') {
            notification.notify({
                title: '연결 불가',
                message: `선택한 시설물이 경로에서 ${Math.round(result.distanceMeters)}m 떨어져 있어 연결할 수 없습니다. (최대 500m)`,
                tone: NotificationToneEnum.ERROR
            })
            return
        }

        if (status === 'warning') {
            notification.notify({
                title: '거리 경고',
                message: `선택한 시설물이 경로에서 ${Math.round(result.distanceMeters)}m 떨어져 있습니다.`,
                tone: NotificationToneEnum.WARNING
            })
        }

        const enrichedPoi = {
            ...poi,
            description: generatePoiComment(poi.name, result.distanceMeters)
        }

        drawing.addPoiToSection(result.sectionIndex, enrichedPoi)
    }
})
useSidewalkSideeffect({ viewer })

// ─── 카메라 정보 ─────────────────────────────────────────────────

const camera = useCameraStore()
const cameraEffect = useCameraSideeffect({ viewer, ...camera })

// ─── 행정경계 ────────────────────────────────────────────────────

useBoundaryStore()
const boundaryEffect = useBoundarySideeffect({ viewer })

// ─── 구간 정보 ──────────────────────────────────────────────────
const sectionInfo = useSectionInfoStore()

const sectionTotalDistance = computed(() => calculateTotalDistance(sectionInfo.sections.value))
const sectionTotalTime = computed(() =>
    formatTime(calculateTotalTime(sectionInfo.sections.value, sectionInfo.userPaces.value))
)

/** 선택 경로가 바뀌면 기존 시뮬레이션을 즉시 정지한다. */
const stopSimulationForRouteChange = () => {
    if (!simulation.playbackState.value.isStopped) {
        simulationEffect.stopPlayback()
    }
}

const handleRouteSelect = async (routeId: string) => {
    stopSimulationForRouteChange()
    const sections = await routeList.select(routeId)
    if (sections) {
        sectionInfo.open(routeId, sections as Parameters<typeof sectionInfo.open>[1])
    }
}

// 경로 선택/해제 시 경로정보 로드/정리
watch(
    () => routeList.selectedRouteId,
    (routeId) => {
        if (routeId) {
            routeInfoEffect.fetchRouteInfos(routeId)
        } else {
            routeInfoStore.clearRouteInfos()
            routeInfoEffect.clearMarkers()
        }
    }
)

// 경로 폴리라인이 지워지면 로컬 경로정보도 함께 정리
watch(
    () => routeDrawStore.drawnPositions.value,
    (positions) => {
        if (!positions) {
            routeInfoStore.clearLocalRouteInfos()
            routeInfoEffect.clearMarkers()
        }
    }
)

// ─── 고도 시각화 ────────────────────────────────────────────────
const elevation = useElevationLayerStore()
const elevationEffect = useElevationLayerSideeffect({
    viewer,
    isElevationVisible: elevation.isElevationVisible
})

// ─── 경사도 시각화 ───────────────────────────────────────────────
const gradient = useGradientStore()
const gradientEffect = useGradientSideeffect({
    viewer,
    isGradientVisible: gradient.isGradientVisible,
    drawnPositions: routeDrawStore.drawnPositions,
    setSegments: gradient.setSegments,
    setDifficulty: gradient.setDifficulty,
    hideRoutePolylines,
    showRoutePolylines
})

// ─── 추천 경로 토글 ──────────────────────────────────────────────
const showRecommend = ref(false)

// ─── 오버레이 가시성 컨텍스트 ────────────────────────────────────
/**
 * 현재 탭·선택 상태·추천 모드에 따라 오버레이 UI 그룹의 표출 컨텍스트를 결정한다.
 * 경로 카드가 화면에서 보이지 않으면 연관 오버레이도 함께 숨긴다.
 */
const overlayContext = computed<MapOverlayContextEnum>(() => {
    if (activeNav.value === '그리기' && drawing.sectionDraft) {
        return MapOverlayContextEnum.DRAWING
    }
    if (activeNav.value === '목록' && routeList.selectedRouteId) {
        return MapOverlayContextEnum.LIST_SELECTED
    }
    if (activeNav.value === '탐색') {
        if (showRecommend.value) return MapOverlayContextEnum.RECOMMEND
        if (explore.selectedRouteId.value) return MapOverlayContextEnum.EXPLORE_SELECTED
    }
    return MapOverlayContextEnum.NONE
})

const handleRouteInfoSubmit = async (payload: { name: string; description: string }) => {
    const pos = routeInfoEffect.clickedPosition.value
    if (!pos) return

    const input = {
        name: payload.name,
        description: payload.description,
        lng: pos.lng,
        lat: pos.lat,
        elevation: pos.elevation
    }

    const routeId = routeList.selectedRouteId
    if (routeId) {
        // 저장된 경로 → 서버에 즉시 저장
        try {
            await routeInfoEffect.submitRouteInfo(routeId, input)
        } catch {
            alert('경로정보 등록에 실패했습니다. 로그인이 필요합니다.')
        }
    } else {
        // 그리기 중 → 로컬에 저장 (경로 저장 시 일괄 전송)
        routeInfoStore.addLocalRouteInfo(input)
        routeInfoEffect.cancelAdding()
    }
}

const simulation = useSimulationStore()
const simulationEffect = useSimulationSideeffect({ viewer })

const weatherRecommend = useWeatherRecommendStore()
const weatherRecommendEffect = useWeatherRecommendSideeffect()

// ─── 시뮬레이션 Drawer ──────────────────────────────────────────
const isSimDrawerOpen = ref(false)

/** 경로정보 Chip 표출 조건: overlayContext에 활성 경로가 있을 때 */
const showRouteInfoChip = computed(() => overlayContext.value.hasActiveRoute)

/** 시뮬레이션 Chip 표출 조건: 활성 경로 + 목록 탭에서는 구간정보 열림 필요 */
const showSimulationChip = computed(() => {
    if (!overlayContext.value.hasActiveRoute) return false
    if (overlayContext.value.isListSelected) return sectionInfo.isOpen.value
    return true
})

// ─── 마운트: 지도 초기화 → 날씨·세션 병렬 로드 ──────────────────

onMounted(async () => {
    await init()
    viewer.value = window.viewer
    await Promise.all([
        districtEffect.init(),
        initWeather(),
        authEffect.fetchSession(),
        cameraEffect.init(),
        boundaryEffect.init(),
        elevationEffect.init(),
        gradientEffect.init(),
        weatherRecommendEffect.fetchRecommendedRoutes()
    ])
})

// ─── 사이드바 탭 구성 ────────────────────────────────────────────

/** 사이드바 네비게이션 탭 목록. 아이콘과 라벨로 구성된다. */
const navItems = [
    { icon: 'i-lucide-list', label: '목록' },
    { icon: 'i-lucide-pencil', label: '그리기' },
    { icon: 'i-lucide-search', label: '탐색' }
] as const

// ─── 탐색 ────────────────────────────────────────────────────────

const explore = useExploreSearchSideeffect()
const districtStore = useDistrictStore()
const districtEffect = useDistrictSideeffect()

/** 시군구 Select 옵션 */
const sigunguOptions = computed(() => [FILTER_ALL, ...districtStore.guNames.value])

/** 읍면동 Select 옵션 (선택된 시군구에 따라 동적 변경) */
const dongOptions = computed(() => {
    if (explore.filter.selectedSigungu.value === FILTER_ALL) return [FILTER_ALL]
    return [FILTER_ALL, ...districtStore.getDongList(explore.filter.selectedSigungu.value)]
})

/** 인증 성공 시 모달을 닫는다. */
const handleAuthSuccess = async () => {
    authStore.closeAuthModal()
}

/** 로그아웃 버튼 클릭 시 세션을 종료하고 사용자 상태를 초기화한다. */
const handleLogout = async () => {
    await authEffect.logout()
}

/** 탐색 결과에서 경로를 선택하면 지도 미리보기와 고도 차트를 표시한다. */
const handleExploreSelect = async (routeId: string) => {
    stopSimulationForRouteChange()
    explore.selectRoute(routeId)
    const route = explore.searchResults.value.find((r) => r.routeId === routeId)
    await exploreSelectRoute(routeId, route?.title)
}

/** 탐색 탭 진입 시 공개 경로 자동 로드 (미로드 상태일 때만 실행) */
watch(activeNav, (next) => {
    if (next !== '목록') {
        sectionInfo.close()
    }
    if (next === '탐색' && explore.searchResults.value.length === 0 && !explore.isSearching.value) {
        explore.search(explore.searchQuery.value)
    }
})

/**
 * 오버레이 컨텍스트가 바뀌면 이전 컨텍스트에서 활성화된 상호작용 UI를 일괄 정리한다.
 * - 경로정보 추가 모드 해제
 * - 시뮬레이션 Drawer 닫기 + 재생 정지
 * - 경로정보 마커 팝업 닫기
 */
watch(overlayContext, (next, prev) => {
    if (next.key === prev.key) return

    // 활성 경로가 사라진 경우: 연관 오버레이 일괄 정리
    if (!next.hasActiveRoute) {
        // 경로정보 추가 모드 해제
        if (routeInfoStore.isAddingRouteInfo.value) {
            routeInfoEffect.cancelAdding()
        }
        // 시뮬레이션 Drawer 닫기 + 재생 정지
        isSimDrawerOpen.value = false
        if (!simulation.playbackState.value.isStopped) {
            simulationEffect.stopPlayback()
        }
        // 경로정보 마커 팝업 닫기
        routeInfoStore.selectedMarkerRouteInfo.value = null
    }
})
</script>

<template>
    <div class="index-page">
        <MapShell :show-second-panel="sectionInfo.isOpen.value">
            <template #sidebar="{ open: sidebarOpen, setSidebarOpen }">
                <MapSidebar :open="sidebarOpen" @update:open="setSidebarOpen">
                    <template #header>
                        <UButton
                            v-if="sidebarOpen"
                            variant="ghost"
                            icon="i-lucide-map-pin"
                            label="Runnable"
                            color="neutral"
                            size="lg"
                        />
                        <UButton
                            variant="ghost"
                            :icon="sidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
                            color="neutral"
                            @click="toggleSidebar"
                        />
                    </template>

                    <template #subheader>
                        <MapSidebarTabs
                            v-model="activeNav"
                            :items="navItems"
                        />
                    </template>

                    <template #default>
                        <template v-if="activeNav === '목록'">
                            <UInput
                                v-model="routeList.searchQuery"
                                type="search"
                                placeholder="경로 이름으로 검색"
                                icon="i-lucide-search"
                            />
                            <RouteListPanel
                                :routes="routeList.filteredRoutes"
                                :selected-route-id="routeList.selectedRouteId"
                                @select="handleRouteSelect"
                                @download="routeList.download"
                            />
                        </template>
                        <DrawRoutePanel
                            v-else-if="activeNav === '그리기'"
                            :section-attrs="drawing.sectionDraft?.attrs ?? []"
                            :section-pois="drawing.sectionPois"
                            :active-section-index="drawing.activeSectionIndex"
                            @reset="drawing.start"
                            @save="drawing.openSaveModal"
                            @update-section-attr="drawing.updateSectionAttr"
                            @remove-section="drawing.removeSection"
                            @remove-poi="
                                drawing.removePoiFromSection($event.sectionIndex, $event.poiIndex)
                            "
                            @select-section="drawing.activeSectionIndex = $event.index"
                        />
                        <template v-else-if="activeNav === '탐색'">
                            <UInput
                                v-model="explore.searchQuery.value"
                                type="search"
                                placeholder="경로 이름으로 검색"
                                icon="i-lucide-search"
                                @keyup.enter="explore.search(explore.searchQuery.value)"
                            />
                            <div class="explore-filter-row">
                                <USelect
                                    :model-value="explore.filter.selectedSigungu.value"
                                    :items="sigunguOptions"
                                    placeholder="시군구"
                                    class="explore-filter-row__select"
                                    @update:model-value="explore.filter.setSigungu($event)"
                                />
                                <USelect
                                    :model-value="explore.filter.selectedDong.value"
                                    :items="dongOptions"
                                    placeholder="읍면동"
                                    class="explore-filter-row__select"
                                    :disabled="explore.filter.selectedSigungu.value === FILTER_ALL"
                                    @update:model-value="explore.filter.selectedDong.value = $event"
                                />
                                <UButton variant="outline" color="neutral" size="sm" icon="i-lucide-rotate-ccw" label="초기화" @click="explore.filter.resetFilters" />
                            </div>
                            <ExplorePanel
                                :routes="explore.filteredResults.value"
                                :selected-route-id="explore.selectedRouteId.value"
                                :is-loading="explore.isSearching.value"
                                :recommend-active="showRecommend"
                                @select="handleExploreSelect"
                                @recommend="showRecommend = !showRecommend"
                            >
                                <template #recommend>
                                    <WeatherRecommendPanel
                                        :routes="weatherRecommend.recommendedRoutes.value"
                                        :is-loading="weatherRecommend.isLoading.value"
                                        @select="handleRouteSelect"
                                    />
                                </template>
                            </ExplorePanel>
                        </template>
                    </template>

                    <template #footer>
                        <SidebarUserProfile
                            :username="authStore.user.value?.name"
                            :image="authStore.user.value?.image ?? undefined"
                            :subtitle="authStore.isLoggedIn.value ? '계정 설정' : '로그인하세요'"
                            @click="
                                authStore.isLoggedIn.value ? undefined : authStore.openLoginModal()
                            "
                            @logout="handleLogout"
                        />
                    </template>
                </MapSidebar>
            </template>

            <template #secondPanel>
                <SecondPanel
                    :panel-title="sectionInfo.panelTitle.value"
                    :sections="sectionInfo.sections.value"
                    :user-paces="sectionInfo.userPaces.value"
                    :total-distance="sectionTotalDistance"
                    :total-time="sectionTotalTime"
                    :is-edit-mode="sectionInfo.isEditMode.value"
                    @update:edit-mode="sectionInfo.isEditMode.value = $event"
                    @update:pace="sectionInfo.updatePace"
                    @update:weight="sectionInfo.updateWeight"
                    @update:strategy="sectionInfo.updateStrategy"
                    @close="sectionInfo.close"
                />
            </template>

            <template #default>
                <div id="map" class="map-view" />
            </template>

            <template #footer>
                <MapFooter :label="camera.footerLabel.value" />
            </template>

            <template #overlay>
                <WeatherOverlay
                    :selected-date="weather.selectedDate.value"
                    :selected-hour="weather.selectedHour.value"
                    :selected-month="weather.selectedMonth.value"
                    :active-layer="weather.activeLayer.value"
                    :monthly-data="weather.monthlyData.value"
                    :is-loading="weather.isLoading.value"
                    :is-elevation-active="elevation.isElevationVisible.value"
                    @update:selected-date="weather.selectedDate.value = $event"
                    @update:selected-hour="weather.selectedHour.value = $event"
                    @update:selected-month="weather.selectedMonth.value = $event"
                    @update:active-layer="weather.activeLayer.value = $event"
                    @update:elevation-active="elevation.isElevationVisible.value = $event"
                />
                <FacilityOverlay
                    :active-types="facility.activeTypes.value"
                    :is-loading="facility.isLoading.value"
                    :is-searching="facility.isSearching.value"
                    :show-simulation="showSimulationChip"
                    :simulation-active="isSimDrawerOpen"
                    :show-route-info="showRouteInfoChip"
                    @toggle="facility.toggleType"
                    @search-nearby="facilityEffect.searchNearby"
                    @toggle-simulation="isSimDrawerOpen = !isSimDrawerOpen"
                />
                <RouteOverlayBottomBar
                    v-if="overlayContext.showDrawingTools || (overlayContext.hasActiveRoute && elevationChart.profile)"
                    :elevation-chip-label="elevationChart.title"
                    :elevation-chip-active="elevationChart.open"
                    :elevation-profile="elevationChart.profile"
                    :closing-mode="closing.mode"
                    :closing-disabled="!drawing.sectionDraft"
                    :show-closing="activeNav === '그리기'"
                    :gradient-active="gradient.isGradientVisible.value"
                    :gradient-difficulty="gradient.currentDifficulty.value"
                    @toggle-elevation="elevationChart.setOpen(!elevationChart.open)"
                    @update:closing-mode="closing.setMode($event)"
                    @toggle-gradient="gradient.toggleGradient"
                />
                <GradientLegend
                    v-if="gradient.isGradientVisible.value"
                    :has-other-legend="
                        !!weather.activeLayer.value || elevation.isElevationVisible.value
                    "
                />
                <RouteElevationModal
                    :open="elevationChart.open"
                    :title="elevationChart.title"
                    :profile="elevationChart.profile"
                    @update:open="elevationChart.setOpen($event)"
                />
                <RouteInfoInputForm
                    v-if="routeInfoEffect.clickedPosition.value"
                    :lng="routeInfoEffect.clickedPosition.value.lng"
                    :lat="routeInfoEffect.clickedPosition.value.lat"
                    :elevation="routeInfoEffect.clickedPosition.value.elevation"
                    @submit="handleRouteInfoSubmit"
                    @cancel="routeInfoEffect.cancelAdding()"
                />
                <RouteInfoMarkerPopup
                    v-if="
                        routeInfoStore.selectedMarkerRouteInfo.value &&
                        !routeInfoEffect.clickedPosition.value
                    "
                    :name="routeInfoStore.selectedMarkerRouteInfo.value.name"
                    :description="routeInfoStore.selectedMarkerRouteInfo.value.description"
                    :author-name="
                        'authorName' in routeInfoStore.selectedMarkerRouteInfo.value
                            ? routeInfoStore.selectedMarkerRouteInfo.value.authorName
                            : undefined
                    "
                    @close="routeInfoStore.selectedMarkerRouteInfo.value = null"
                />
                <!-- 그리기 완료 후 경로정보 안내 모달 -->
                <div
                    v-if="showRouteInfoGuide"
                    class="route-info-guide-modal"
                    @click="showRouteInfoGuide = false"
                >
                    <div class="route-info-guide-modal__content" @click.stop>
                        <p>화면을 클릭해 해당 위치에 장소 설명을 추가할 수 있습니다.</p>
                        <button
                            class="route-info-guide-modal__btn"
                            @click="showRouteInfoGuide = false"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </template>
        </MapShell>

        <SimulationDrawer
            v-model:open="isSimDrawerOpen"
            @play="simulationEffect.startPlayback(routeDrawStore.drawnPositions.value ?? [])"
            @pause="simulationEffect.pausePlayback()"
            @stop="simulationEffect.stopPlayback()"
            @seek="simulationEffect.seekTo($event)"
            @speed-change="simulation.setPlaybackSpeed($event)"
        />

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
        <AuthModal
            :open="authStore.isAuthModalOpen.value"
            :mode="authStore.authModalMode.value"
            @update:open="authStore.isAuthModalOpen.value = $event"
            @update:mode="authStore.authModalMode.value = $event"
            @success="handleAuthSuccess"
        />
    </div>
</template>

<style scoped src="~/assets/css/pages/index.css"></style>

<style scoped>
.route-info-guide-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
}

.route-info-guide-modal__content {
    background: var(--color-surface, #1a1a1a);
    border: 1px solid var(--color-border, #333);
    border-radius: 10px;
    padding: 20px 24px;
    text-align: center;
    max-width: 320px;
    color: var(--color-text, #fff);
    font-size: 14px;
    line-height: 1.5;
}

.route-info-guide-modal__btn {
    margin-top: 12px;
    padding: 8px 24px;
    background: var(--color-primary, #4caf50);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
}
</style>
