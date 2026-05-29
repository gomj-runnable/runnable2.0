import { FACILITY_LAYERS } from '~/entities/facility/model/useFacilityStore'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import type { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'
import type { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import type { useElevationLayerStore } from '~/features/elevation-layer/model/useElevationLayerStore'
import type { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import type { useGradientStore } from '~/entities/gradient/model/useGradientStore'
import type { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'

interface FabGroupsOptions {
    mapLayers: {
        facility: ReturnType<typeof useFacilityStore>
        elevation: ReturnType<typeof useElevationLayerStore>
        boundary: ReturnType<typeof useBoundaryStore>
        gradient: ReturnType<typeof useGradientStore>
    }
    overlayContext: ComputedRef<MapOverlayContextEnum>
    elevationChart: {
        title: string
        open: boolean
        profile: unknown
        setOpen: (open: boolean) => void
    }
    activeNav: Ref<string>
    closing: {
        mode: RouteClosingModeEnum | null
        setMode: (mode: RouteClosingModeEnum | null) => void
    }
    routeInfoStore: ReturnType<typeof useRouteInfoStore>
    showRouteInfoChip: ComputedRef<boolean>
}

/**
 * 모바일 전용 플로팅 액션 메뉴 그룹 정의를 반환하는 composable.
 */
export const useFabGroups = (options: FabGroupsOptions) => {
    const {
        mapLayers,
        overlayContext,
        elevationChart,
        activeNav,
        closing,
        routeInfoStore,
        showRouteInfoChip
    } = options

    const { facility, elevation, boundary, gradient } = mapLayers

    /** 모바일: 현재 위치 검색 버튼 노출 조건 */
    const fabNearbyVisible = computed(() =>
        (['crosswalk', 'fountain', 'hospital'] as const).some((t) =>
            facility.activeTypes.value.has(t)
        )
    )

    const fabGroups = computed(() => [
        {
            key: 'facility',
            label: '시설물',
            icon: 'i-lucide-building-2',
            items: [
                ...FACILITY_LAYERS.map((layer) => ({
                    key: layer.type,
                    label: layer.label,
                    icon: layer.icon,
                    dotColor: layer.color,
                    active: facility.activeTypes.value.has(layer.type),
                    onClick: () => facility.toggleType(layer.type)
                }))
            ]
        },
        {
            key: 'map-layer',
            label: '지도 레이어',
            icon: 'i-lucide-layers',
            items: [
                {
                    key: 'elevation',
                    label: '지역 고도',
                    icon: 'i-lucide-mountain',
                    active: elevation.isElevationVisible.value,
                    onClick: () => {
                        elevation.isElevationVisible.value = !elevation.isElevationVisible.value
                    }
                },
                {
                    key: 'gu',
                    label: '시군구',
                    icon: 'i-lucide-map',
                    active: boundary.isGuActive.value,
                    onClick: () => boundary.toggleGu()
                },
                {
                    key: 'dong',
                    label: '읍면동',
                    icon: 'i-lucide-map-pin',
                    active: boundary.isDongActive.value,
                    onClick: () => boundary.toggleDong()
                }
            ]
        },
        {
            key: 'route-tools',
            label: '경로 도구',
            icon: 'i-lucide-route',
            visible:
                overlayContext.value.showDrawingTools ||
                (overlayContext.value.hasActiveRoute && !!elevationChart.profile),
            items: [
                {
                    key: 'elevation-chart',
                    label: elevationChart.title,
                    icon: 'i-lucide-chart-line',
                    active: elevationChart.open,
                    visible: !!elevationChart.profile,
                    onClick: () => elevationChart.setOpen(!elevationChart.open)
                },
                {
                    key: 'loop-close',
                    label: '도착지 연결',
                    icon: 'i-lucide-rotate-ccw',
                    active: closing.mode?.isLoopClose ?? false,
                    visible: activeNav.value === '그리기',
                    onClick: () =>
                        closing.setMode(
                            closing.mode?.isLoopClose ? null : RouteClosingModeEnum.LOOP_CLOSE
                        )
                },
                {
                    key: 'round-trip',
                    label: '왕복 코스',
                    icon: 'i-lucide-arrow-left-right',
                    active: closing.mode?.isRoundTrip ?? false,
                    visible: activeNav.value === '그리기',
                    onClick: () =>
                        closing.setMode(
                            closing.mode?.isRoundTrip ? null : RouteClosingModeEnum.ROUND_TRIP
                        )
                },
                {
                    key: 'gradient',
                    label: '경사도',
                    icon: 'i-lucide-trending-up',
                    active: gradient.isGradientVisible.value,
                    onClick: () => gradient.toggleGradient()
                }
            ]
        },
        {
            key: 'features',
            label: '기능',
            icon: 'i-lucide-message-circle',
            visible: showRouteInfoChip.value,
            items: [
                {
                    key: 'route-info',
                    label: '경로정보',
                    icon: 'i-lucide-message-circle',
                    active: routeInfoStore.isAddingRouteInfo.value,
                    visible: showRouteInfoChip.value,
                    onClick: () => routeInfoStore.toggleAddingMode()
                }
            ]
        }
    ])

    return { fabGroups, fabNearbyVisible }
}
