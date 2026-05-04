import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useMapInit } from '~/shared/lib/map/useMapInit'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'
import { useWeatherStore } from '~/entities/weather/model/useWeatherStore'
import { useWeatherSideeffect } from '~/features/weather-overlay/api/useWeatherSideeffect'
import { useWeatherSourceStrategy } from '~/entities/weather/model/useWeatherSourceStrategy'
import { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import { useFacilitySideeffect } from '~/entities/facility/api/useFacilitySideeffect'
import { useSidewalkSideeffect } from '~/entities/facility/api/useSidewalkSideeffect'
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { useCameraSideeffect } from '~/features/camera/api/useCameraSideeffect'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { useBoundarySideeffect } from '~/entities/boundary/api/useBoundarySideeffect'
import { useElevationLayerStore } from '~/features/elevation-layer/model/useElevationLayerStore'
import { useElevationLayerSideeffect } from '~/features/elevation-layer/api/useElevationLayerSideeffect'
import { useGradientStore } from '~/entities/gradient/model/useGradientStore'
import { useGradientSideeffect } from '~/entities/gradient/api/useGradientSideeffect'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { useSimulationStore } from '~/features/simulation/model/useSimulationStore'
import { useSimulationSideeffect } from '~/features/simulation/api/useSimulationSideeffect'
import { useWeatherRecommendStore } from '~/entities/weather/model/useWeatherRecommendStore'
import { useWeatherRecommendSideeffect } from '~/features/weather-overlay/api/useWeatherRecommendSideeffect'
import {
    findNearestSection,
    validatePoiDistance,
    generatePoiComment
} from '~/entities/route/lib/usePoiSnapping'

interface UseMapFeatureInitOptions {
    viewer: ShallowRef<CesiumViewer | null>
    drawing: any
    routeDrawStore: any
    notification: any
    hideRoutePolylines: () => void
    showRoutePolylines: () => void
    /** districtEffect.init() 등 외부 init을 onMounted에 추가 */
    additionalInits?: (() => Promise<unknown>)[]
}

export function useMapFeatureInit({
    viewer,
    drawing,
    routeDrawStore,
    notification,
    hideRoutePolylines,
    showRoutePolylines,
    additionalInits = []
}: UseMapFeatureInitOptions) {
    // ─── 지도 초기화 ────────────────────────────────────────────────
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

    // ─── 인증 ────────────────────────────────────────────────────────
    const authStore = useAuthStore()
    const authEffect = useAuthSideeffect()

    // ─── 날씨 ────────────────────────────────────────────────────────
    const weather = useWeatherStore()
    const weatherSources = useWeatherSourceStrategy()
    const { init: initWeather } = useWeatherSideeffect({ viewer, ...weather })

    // ─── 편의시설 ────────────────────────────────────────────────────
    const facility = useFacilityStore()
    const sidewalk = useSidewalkStore()
    const facilityEffect = useFacilitySideeffect({
        viewer,
        ...facility,
        onPoiClick: (poi: any) => {
            // 드로잉 상태가 아니면 무시
            if (!drawing.sectionDraft) return

            const ranges = routeDrawStore.sectionPointRanges.value
            const positions = routeDrawStore.drawnPositions.value
            if (!positions?.length || !ranges.length) return

            // 구간별 좌표 추출
            const sectionGeometries = ranges.map((range: any) => ({
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

    // ─── 탐색 ────────────────────────────────────────────────────────
    const explore = useExploreSearchSideeffect()

    // ─── 시뮬레이션 ──────────────────────────────────────────────────
    const simulation = useSimulationStore()
    const simulationEffect = useSimulationSideeffect({ viewer })

    // ─── 날씨 추천 ──────────────────────────────────────────────────
    const weatherRecommend = useWeatherRecommendStore()
    const weatherRecommendEffect = useWeatherRecommendSideeffect()

    // ─── 마운트: 지도 초기화 → 각 기능 병렬 로드 ─────────────────────
    onMounted(async () => {
        await init()
        viewer.value = window.viewer
        await Promise.all([
            initWeather(),
            authEffect.fetchSession(),
            cameraEffect.init(),
            boundaryEffect.init(),
            elevationEffect.init(),
            gradientEffect.init(),
            weatherRecommendEffect.fetchRecommendedRoutes(),
            ...additionalInits.map((fn) => fn())
        ])
    })

    return {
        authStore,
        authEffect,
        weather,
        weatherSources,
        facility,
        sidewalk,
        facilityEffect,
        camera,
        boundary,
        boundaryEffect,
        elevation,
        elevationEffect,
        gradient,
        gradientEffect,
        explore,
        simulation,
        simulationEffect,
        weatherRecommend,
        weatherRecommendEffect
    }
}
