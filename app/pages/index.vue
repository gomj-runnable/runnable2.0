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
import AuthSlideOverContent from '~/entities/user/ui/AuthSlideOverContent.vue'
import { useSlideOverNav } from '~/widgets/map-shell/model/useSlideOverNav'
import { NavKey } from '~/widgets/map-shell/model/nav-key'
import DrawRoutePanel from '~/features/draw-route/ui/DrawRoutePanel.vue'
import RouteElevationModal from '~/features/draw-route/ui/RouteElevationModal.vue'
import RouteOverlayBottomBar from '~/features/draw-route/ui/RouteOverlayBottomBar.vue'
import RouteSaveModal from '~/features/draw-route/ui/RouteSaveModal.vue'
import RouteListPanel from '~/features/draw-route/ui/RouteListPanel.vue'
import WeatherOverlay from '~/features/weather-overlay/ui/WeatherOverlay.vue'
import FacilityOverlay from '~/widgets/facility-overlay/ui/FacilityOverlay.vue'
import GradientLegend from '~/entities/gradient/ui/GradientLegend.vue'
import ExplorePanel from '~/features/explore/ui/ExplorePanel.vue'
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
import { useWeatherSourceStrategy } from '~/entities/weather/model/useWeatherSourceStrategy'
import { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import { useFacilitySideeffect } from '~/entities/facility/api/useFacilitySideeffect'
import { useSidewalkSideeffect } from '~/entities/facility/api/useSidewalkSideeffect'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { useCameraSideeffect } from '~/features/camera/api/useCameraSideeffect'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { useBoundarySideeffect } from '~/entities/boundary/api/useBoundarySideeffect'
import MapFooter from '~/widgets/map-shell/ui/MapFooter.vue'
import SecondPanel from '~/widgets/right-panel/ui/SecondPanel.vue'
import { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'
import {
    calculateTotalDistance,
    calculateTotalTime,
    calculateRangeDistance,
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
import { useWeatherRecommendSideeffect } from '~/features/weather-overlay/api/useWeatherRecommendSideeffect'
import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'
import { useMapInit } from '~/shared/lib/map/useMapInit'
import { useDistrictStore } from '~/entities/boundary/model/useDistrictStore'
import RouteInfoInputForm from '~/entities/route/ui/RouteInfoInputForm.vue'
import RouteInfoMarkerPopup from '~/entities/route/ui/RouteInfoMarkerPopup.vue'
import FacilityMarkerPopup from '~/entities/facility/ui/FacilityMarkerPopup.vue'
import SimulationDrawer from '~/features/simulation/ui/SimulationDrawer.vue'
import WeatherRecommendPanel from '~/features/weather-overlay/ui/WeatherRecommendPanel.vue'
import FloatingActionMenu from '~/shared/ui/FloatingActionMenu.vue'
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import { useMobileDetect } from '~/shared/lib/useMobileDetect'
import { useOverlayContext } from '~/widgets/map-shell/model/useOverlayContext'
import { useFabGroups } from '~/widgets/map-shell/model/useFabGroups'

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

// ─── 키보드 단축키 ──────────────────────────────────────────────

defineShortcuts({
    escape: () => {
        if (drawing.isDrawingActive) {
            drawing.finish()
        } else if (slideOver.isOpen.value) {
            slideOver.close()
        }
    },
    meta_s: {
        handler: () => {
            if (drawing.sectionDraft) {
                drawing.openSaveModal()
            }
        },
        usingInput: true
    }
})

// ─── 인증 ────────────────────────────────────────────────────────

const authStore = useAuthStore()
const authEffect = useAuthSideeffect()

// ─── SlideOver 네비게이션 ────────────────────────────────────────

const slideOver = useSlideOverNav(activeNav)
const authContentRef = ref<InstanceType<typeof AuthSlideOverContent> | null>(null)

/** SlideOver에서 로그인 탭 진입 시 폼 초기화 */
watch(slideOver.current, (nav) => {
    if (nav === NavKey.AUTH) authContentRef.value?.reset()
})

// ─── 날씨·편의시설 ───────────────────────────────────────────────

const weather = useWeatherStore()
const weatherSources = useWeatherSourceStrategy()
const { init: initWeather } = useWeatherSideeffect({ viewer, ...weather })

const facility = useFacilityStore()
const sidewalk = useSidewalkStore()
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

const boundary = useBoundaryStore()
const boundaryEffect = useBoundarySideeffect({ viewer })

// ─── 구간 정보 ──────────────────────────────────────────────────
const sectionInfo = useSectionInfoStore()

const sectionDistances = computed(() => {
    const positions = routeDrawStore.drawnPositions.value
    const ranges = routeDrawStore.sectionPointRanges.value
    if (!positions?.length || !ranges.length) return []
    return ranges.map((range) => calculateRangeDistance(positions, range))
})

const sectionTotalDistance = computed(() => calculateTotalDistance(sectionInfo.sections.value))
const sectionTotalTime = computed(() =>
    formatTime(calculateTotalTime(sectionInfo.sections.value, sectionInfo.userPaces.value))
)

// ─── Step 네비게이션 (경로목록 → 구간정보) ─────────────────────────
const showStepBackConfirm = ref(false)

/** SlideOver 제목: 구간정보가 열려있으면 덮어쓴다 */
const slideOverTitle = computed(() => {
    if (
        sectionInfo.isOpen.value &&
        (slideOver.current.value === NavKey.LIST || slideOver.current.value === NavKey.EXPLORE)
    ) {
        return sectionInfo.panelTitle.value
    }
    return slideOver.meta.value.title
})
const slideOverDescription = computed(() => {
    if (
        sectionInfo.isOpen.value &&
        (slideOver.current.value === NavKey.LIST || slideOver.current.value === NavKey.EXPLORE)
    ) {
        return '구간별 페이스·짐 무게·전략을 설정합니다'
    }
    return slideOver.meta.value.description
})

/** 구간정보 → 경로목록으로 돌아가기 (항상 경고) */
const handleStepBack = () => {
    showStepBackConfirm.value = true
}
const confirmStepBack = () => {
    showStepBackConfirm.value = false
    sectionInfo.close()
}

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

/** 목록에서 내 경로를 수정 모드로 열어 그리기 탭으로 전환한다 */
const handleRouteEdit = async (routeId: string) => {
    stopSimulationForRouteChange()
    const sections = await routeList.select(routeId)
    if (!sections?.length) return

    const route = routeList.filteredRoutes.find((r: any) => r.routeId === routeId)
    routeDrawStore.editingRouteId.value = routeId
    routeDrawStore.routeForm.value = {
        title: route?.title ?? '',
        description: route?.description ?? ''
    }

    // 그리기 탭으로 전환 (드로잉은 시작하지 않음 - 기존 데이터로 로드)
    activeNav.value = '그리기'
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

// ─── 탐색 (overlayContext보다 앞에 선언 필요) ───────────────────
const explore = useExploreSearchSideeffect()

const simulation = useSimulationStore()
const simulationEffect = useSimulationSideeffect({ viewer })

const weatherRecommend = useWeatherRecommendStore()
const weatherRecommendEffect = useWeatherRecommendSideeffect()

// ─── 시뮬레이션 Drawer ──────────────────────────────────────────
const isSimDrawerOpen = ref(false)

// ─── 오버레이 가시성 컨텍스트 ────────────────────────────────────
const { overlayContext, showRouteInfoChip, showSimulationChip } = useOverlayContext({
    activeNav,
    sectionDraft: computed(() => drawing.sectionDraft),
    selectedRouteId: routeList.selectedRouteId,
    exploreSelectedRouteId: computed(() => explore.selectedRouteId.value),
    showRecommend,
    routeInfoStore,
    routeInfoEffect,
    simulation,
    simulationEffect,
    isSimDrawerOpen,
    sectionInfo
})

// ─── 모바일 감지 ────────────────────────────────────────────────
const { isMobile } = useMobileDetect()

/** 모바일: 경로 그리기 도움말 모달 표시 여부 */
const showDrawingHelpModal = ref(false)

/** 모바일에서 드로잉이 시작되면 자동으로 도움말 모달을 표시한다 */
watch(
    () => drawing.isDrawingActive,
    (active) => {
        if (active && isMobile.value) {
            showDrawingHelpModal.value = true
        }
    }
)

/** 모바일에서 경로 그리기 초기화 시 도움말 모달을 표시한다 */
const handleDrawingStartWithHelp = () => {
    drawing.start()
}

// ─── FAB 그룹 (모바일 전용 플로팅 메뉴) ─────────────────────────
const { fabGroups, fabNearbyVisible } = useFabGroups({
    facility,
    sidewalk,
    elevation,
    boundary,
    weather,
    weatherSources,
    gradient,
    overlayContext,
    elevationChart,
    activeNav,
    closing,
    routeInfoStore,
    isSimDrawerOpen,
    showSimulationChip,
    showRouteInfoChip
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

// ─── 탐색 ────────────────────────────────────────────────────────

const districtStore = useDistrictStore()
const districtEffect = useDistrictSideeffect()

/** 시군구 Select 옵션 */
const sigunguOptions = computed(() => [FILTER_ALL, ...districtStore.guNames.value])

/** 읍면동 Select 옵션 (선택된 시군구에 따라 동적 변경) */
const dongOptions = computed(() => {
    if (explore.filter.selectedSigungu.value === FILTER_ALL) return [FILTER_ALL]
    return [FILTER_ALL, ...districtStore.getDongList(explore.filter.selectedSigungu.value)]
})

/** 인증 성공 시 SlideOver를 닫는다. */
const handleAuthSuccess = async () => {
    slideOver.close()
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

    try {
        const sections = await explore.fetchSections(routeId)
        if (sections.length) {
            sectionInfo.open(routeId, sections as Parameters<typeof sectionInfo.open>[1], {
                readOnly: true,
                title: route?.title ?? '경로 미리보기'
            })
        }
    } catch (e) {
        console.error('[ExploreSelect] 구간 로드 실패:', e)
    }
}

/** 탐색 탭에서 경로를 가져오기(fork)한다. 중복 시 알림을 표시한다. */
const handleExploreImport = async (routeId: string) => {
    try {
        await $fetch(`/api/routes/fork/${routeId}`, { method: 'POST' })
        await routeList.refresh()
        notification.notify({
            title: '경로 가져오기 완료',
            message: '내 경로 목록에 추가되었습니다.',
            tone: NotificationToneEnum.SUCCESS
        })
    } catch (e: any) {
        const message = e?.data?.message ?? '경로 가져오기에 실패했습니다.'
        notification.notify({
            title: '경로 가져오기',
            message,
            tone: NotificationToneEnum.WARNING
        })
    }
}

/** 탐색 탭 진입 시 공개 경로 자동 로드 (미로드 상태일 때만 실행) */
watch(activeNav, (next) => {
    if (next !== '목록' && next !== '탐색') {
        sectionInfo.close()
    }
    if (next === '탐색' && explore.searchResults.value.length === 0 && !explore.isSearching.value) {
        explore.search(explore.searchQuery.value)
    }
})
</script>

<template>
    <div class="index-page">
        <MapShell>
            <template #sidebar>
                <MapSidebar
                    :active-nav="slideOver.lastActive.value"
                    :is-logged-in="authStore.isLoggedIn.value"
                    @select="slideOver.select"
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
                    :style="
                        !isMobile && slideOver.isOpen.value
                            ? { left: '24rem', transition: 'left 300ms ease' }
                            : { transition: 'left 300ms ease' }
                    "
                    :selected-date="weather.selectedDate.value"
                    :selected-hour="weather.selectedHour.value"
                    :selected-month="weather.selectedMonth.value"
                    :active-layer="weather.activeLayer.value"
                    :is-loading="weather.isLoading.value"
                    :is-elevation-active="elevation.isElevationVisible.value"
                    :available-dates="weatherSources.filteredAvailableDates.value"
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
                    :disabled="!viewer"
                    :show-simulation="showSimulationChip"
                    :simulation-active="isSimDrawerOpen"
                    :show-route-info="showRouteInfoChip"
                    @toggle="facility.toggleType"
                    @search-nearby="facilityEffect.searchNearby"
                    @toggle-simulation="isSimDrawerOpen = !isSimDrawerOpen"
                />
                <RouteOverlayBottomBar
                    v-if="
                        overlayContext.showDrawingTools ||
                        (overlayContext.hasActiveRoute && elevationChart.profile)
                    "
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
                <FacilityMarkerPopup
                    v-if="facility.selectedFacility.value"
                    :facility="facility.selectedFacility.value"
                    @close="facility.selectedFacility.value = null"
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
                <!-- 모바일: 드로잉 중 "완료" 플로팅 버튼 -->
                <Teleport to="body">
                    <div v-if="isMobile && drawing.isDrawingActive" class="drawing-finish-btn">
                        <UButton
                            icon="i-lucide-check"
                            label="경로 완성"
                            size="lg"
                            color="primary"
                            class="rounded-full shadow-lg"
                            @click="drawing.finish"
                        />
                    </div>
                </Teleport>
                <!-- 모바일: 경로 그리기 도움말 모달 -->
                <UModal
                    v-model:open="showDrawingHelpModal"
                    title="경로 그리기 안내"
                    :ui="{ footer: 'justify-end' }"
                >
                    <template #body>
                        <div class="flex flex-col gap-3 text-sm">
                            <div class="flex items-start gap-2">
                                <UIcon
                                    name="i-lucide-hand"
                                    class="size-5 shrink-0 mt-0.5 text-(--ui-primary)"
                                />
                                <p><strong>지도를 탭</strong>하여 경로 구간을 추가하세요.</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <UIcon
                                    name="i-lucide-check-circle"
                                    class="size-5 shrink-0 mt-0.5 text-(--ui-primary)"
                                />
                                <p>
                                    구간을 2개 이상 추가한 뒤 하단의
                                    <strong>"경로 완성"</strong> 버튼을 눌러 경로를 완성하세요.
                                </p>
                            </div>
                            <div class="flex items-start gap-2">
                                <UIcon
                                    name="i-lucide-rotate-ccw"
                                    class="size-5 shrink-0 mt-0.5 text-(--ui-text-muted)"
                                />
                                <p>
                                    사이드바의 <strong>"초기화"</strong> 버튼을 누르면 경로를 다시
                                    그릴 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </template>
                    <template #footer>
                        <UButton label="확인" @click="showDrawingHelpModal = false" />
                    </template>
                </UModal>
            </template>
        </MapShell>

        <!-- 탭 콘텐츠: SlideOver (모바일·데스크톱 공통) -->
        <USlideover
            v-model:open="slideOver.isOpen.value"
            :title="slideOverTitle"
            :description="slideOverDescription"
            side="left"
            :overlay="false"
            :modal="false"
            :dismissible="false"
            :ui="{
                content: 'top-(--ui-header-height)! max-w-[75vw] lg:max-w-sm',
                header: 'flex!'
            }"
        >
            <template #body>
                <!-- 목록 -->
                <div v-if="slideOver.current.value === NavKey.LIST" class="flex flex-col gap-1">
                    <!-- 구간정보 step -->
                    <template v-if="sectionInfo.isOpen.value">
                        <div class="flex items-center gap-1.5 mb-2">
                            <UButton
                                icon="i-lucide-chevron-left"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                label="경로목록"
                                @click="handleStepBack"
                            />
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="text-[var(--ui-text-dimmed)] size-3"
                            />
                            <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                                구간정보
                            </span>
                        </div>
                        <SecondPanel
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
                            @close="handleStepBack"
                        />
                    </template>
                    <!-- 기본 경로목록 -->
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
                            :current-user-id="authStore.user.value?.id"
                            @select="handleRouteSelect"
                            @download="routeList.download"
                            @edit="handleRouteEdit"
                        />
                    </template>
                </div>

                <!-- 그리기 -->
                <DrawRoutePanel
                    v-else-if="slideOver.current.value === NavKey.DRAW"
                    :section-attrs="drawing.sectionDraft?.attrs ?? []"
                    :section-distances="sectionDistances"
                    :section-pois="drawing.sectionPois"
                    :active-section-index="drawing.activeSectionIndex"
                    @reset="handleDrawingStartWithHelp"
                    @save="drawing.openSaveModal"
                    @update-section-attr="drawing.updateSectionAttr"
                    @remove-section="drawing.removeSection"
                    @add-section="drawing.addSection"
                    @remove-poi="drawing.removePoiFromSection($event.sectionIndex, $event.poiIndex)"
                    @select-section="drawing.activeSectionIndex = $event.index"
                />

                <!-- 탐색 -->
                <div
                    v-else-if="slideOver.current.value === NavKey.EXPLORE"
                    class="flex flex-col gap-1"
                >
                    <!-- 구간정보 step -->
                    <template v-if="sectionInfo.isOpen.value">
                        <div class="flex items-center gap-1.5 mb-2">
                            <UButton
                                icon="i-lucide-chevron-left"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                label="경로탐색"
                                @click="handleStepBack"
                            />
                            <UIcon
                                name="i-lucide-chevron-right"
                                class="text-[var(--ui-text-dimmed)] size-3"
                            />
                            <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                                구간정보
                            </span>
                        </div>
                        <SecondPanel
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
                            @close="handleStepBack"
                        />
                    </template>
                    <!-- 기본 탐색 목록 -->
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
                                @click="explore.filter.resetFilters"
                            />
                        </div>
                        <ExplorePanel
                            :routes="explore.filteredResults.value"
                            :selected-route-id="explore.selectedRouteId.value"
                            :is-loading="explore.isSearching.value"
                            :recommend-active="showRecommend"
                            @select="handleExploreSelect"
                            @import="handleExploreImport"
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
                </div>

                <!-- 로그인 / 내 계정 -->
                <AuthSlideOverContent
                    v-else-if="slideOver.current.value === NavKey.AUTH"
                    ref="authContentRef"
                    @success="handleAuthSuccess"
                    @logout="handleLogout"
                />
            </template>
        </USlideover>

        <!-- 구간정보 → 경로목록 뒤로가기 확인 모달 -->
        <UModal v-model:open="showStepBackConfirm" title="구간정보 닫기">
            <template #body>
                <p class="text-sm text-[var(--ui-text-muted)]">
                    구간정보를 닫으면 현재 설정한 내용이 사라집니다. 돌아가시겠습니까?
                </p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        variant="outline"
                        color="neutral"
                        label="취소"
                        @click="showStepBackConfirm = false"
                    />
                    <UButton
                        variant="solid"
                        color="error"
                        label="돌아가기"
                        @click="confirmStepBack"
                    />
                </div>
            </template>
        </UModal>

        <!-- 모바일: SlideOver 닫혔을 때 다시 열기 탭 -->
        <div
            v-if="isMobile && !slideOver.isOpen.value"
            class="fixed top-1/2 left-0 z-30 -translate-y-1/2"
        >
            <UButton
                icon="i-lucide-chevron-right"
                size="xs"
                color="neutral"
                variant="solid"
                class="rounded-l-none rounded-r-lg shadow-lg opacity-70"
                @click="slideOver.select(slideOver.lastActive.value)"
            />
        </div>

        <FloatingActionMenu :groups="fabGroups" />

        <!-- 모바일 전용: 현재 위치 검색 플로팅 버튼 -->
        <div v-if="fabNearbyVisible" class="fab-nearby">
            <UButton
                icon="i-lucide-locate"
                label="현재 위치 검색"
                size="sm"
                color="neutral"
                variant="solid"
                @click="facilityEffect.searchNearby()"
            />
        </div>

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
            :is-editing="!!saveModal.editingRouteId"
            @update:open="saveModal.open = $event"
            @update:title="saveModal.routeForm.title = $event"
            @update:description="saveModal.routeForm.description = $event"
            @submit="saveModal.confirm"
        />
    </div>
</template>

<style scoped>
.route-info-guide-modal {
    position: fixed;
    inset: 0;
    z-index: 50;
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

.fab-nearby {
    position: fixed;
    bottom: 4rem;
    right: 5.5rem;
    z-index: 35;
    display: none;
}

@media (max-width: 1023px) {
    .fab-nearby {
        display: block;
    }
}

.drawing-finish-btn {
    position: fixed;
    bottom: 4rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 35;
}
</style>

<style>
/* SlideOver: Nav Rail 옆에서 열리는 애니메이션 (portal 렌더링이므로 unscoped) */
.slideover-from-rail[data-state='open'] {
    animation: rail-slide-in 200ms ease-out;
}
.slideover-from-rail[data-state='closed'] {
    animation: rail-slide-out 150ms ease-in;
}

@keyframes rail-slide-in {
    from {
        opacity: 0;
        transform: translateX(-1rem);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes rail-slide-out {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(-1rem);
    }
}
</style>
