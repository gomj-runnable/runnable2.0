import { FACILITY_LAYERS } from '~/entities/facility/model/useFacilityStore'
import { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import type { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'
import type { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import type { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import type { useElevationLayerStore } from '~/features/elevation-layer/model/useElevationLayerStore'
import type { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import type { useWeatherStore } from '~/entities/weather/model/useWeatherStore'
import type { useGradientStore } from '~/entities/gradient/model/useGradientStore'
import type { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'

interface FabGroupsOptions {
    mapLayers: {
        facility: ReturnType<typeof useFacilityStore>
        sidewalk: ReturnType<typeof useSidewalkStore>
        elevation: ReturnType<typeof useElevationLayerStore>
        boundary: ReturnType<typeof useBoundaryStore>
        gradient: ReturnType<typeof useGradientStore>
    }
    weather: { store: ReturnType<typeof useWeatherStore> }
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
    isSimDrawerOpen: Ref<boolean>
    showSimulationChip: ComputedRef<boolean>
    showRouteInfoChip: ComputedRef<boolean>
}

/**
 * 모바일 전용 플로팅 액션 메뉴 그룹 정의를 반환하는 composable.
 */
export const useFabGroups = (options: FabGroupsOptions) => {
    const {
        mapLayers,
        weather,
        overlayContext,
        elevationChart,
        activeNav,
        closing,
        routeInfoStore,
        isSimDrawerOpen,
        showSimulationChip,
        showRouteInfoChip
    } = options

    const { facility, sidewalk, elevation, boundary, gradient } = mapLayers

    /** 모바일: 현재 위치 검색 버튼 노출 조건 */
    const fabNearbyVisible = computed(() =>
        (['crosswalk', 'fountain', 'hospital', 'sidewalk'] as const).some(
            (t) =>
                facility.activeTypes.value.has(t) || (t === 'sidewalk' && sidewalk.isActive.value)
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
                    active:
                        layer.type === 'sidewalk'
                            ? sidewalk.isActive.value
                            : facility.activeTypes.value.has(layer.type),
                    onClick: () => {
                        if (layer.type === 'sidewalk') {
                            sidewalk.toggleActive()
                        } else {
                            facility.toggleType(layer.type)
                        }
                    }
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
                        const next = !elevation.isElevationVisible.value
                        elevation.isElevationVisible.value = next
                        if (next) weather.store.activeLayer.value = null
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
            key: 'weather',
            label: '날씨',
            icon: 'i-lucide-cloud-sun',
            items: [
                {
                    key: 'weather-layer',
                    label: '예보',
                    icon: 'i-lucide-cloud-sun',
                    active:
                        weather.store.activeLayer.value?.equals(WeatherLayerEnum.WEATHER) ?? false,
                    onClick: () => {
                        const next = weather.store.activeLayer.value?.equals(
                            WeatherLayerEnum.WEATHER
                        )
                            ? null
                            : WeatherLayerEnum.WEATHER
                        weather.store.activeLayer.value = next
                        if (next && elevation.isElevationVisible.value)
                            elevation.isElevationVisible.value = false
                    }
                },
                {
                    key: 'temperature',
                    label: '온도',
                    icon: 'i-lucide-thermometer',
                    active:
                        weather.store.activeLayer.value?.equals(WeatherLayerEnum.TEMPERATURE) ??
                        false,
                    onClick: () => {
                        const next = weather.store.activeLayer.value?.equals(
                            WeatherLayerEnum.TEMPERATURE
                        )
                            ? null
                            : WeatherLayerEnum.TEMPERATURE
                        weather.store.activeLayer.value = next
                        if (next && elevation.isElevationVisible.value)
                            elevation.isElevationVisible.value = false
                    }
                },
                {
                    key: 'pm10',
                    label: '미세먼지',
                    icon: 'i-lucide-wind',
                    active: weather.store.activeLayer.value?.equals(WeatherLayerEnum.PM10) ?? false,
                    onClick: () => {
                        const next = weather.store.activeLayer.value?.equals(WeatherLayerEnum.PM10)
                            ? null
                            : WeatherLayerEnum.PM10
                        weather.store.activeLayer.value = next
                        if (next && elevation.isElevationVisible.value)
                            elevation.isElevationVisible.value = false
                    }
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
            icon: 'i-lucide-play-circle',
            visible: showSimulationChip.value || showRouteInfoChip.value,
            items: [
                {
                    key: 'simulation',
                    label: '시뮬레이션',
                    icon: 'i-lucide-play-circle',
                    active: isSimDrawerOpen.value,
                    visible: showSimulationChip.value,
                    onClick: () => {
                        isSimDrawerOpen.value = !isSimDrawerOpen.value
                    }
                },
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
