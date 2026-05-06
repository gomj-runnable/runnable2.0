import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useMapInit } from '~/shared/lib/map/useMapInit'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { useCameraSideeffect } from '~/features/camera/api/useCameraSideeffect'
import { useExploreSearchSideeffect } from '~/features/explore/api/useExploreSearchSideeffect'
import { useSimulationStore } from '~/features/simulation/model/useSimulationStore'
import { useSimulationSideeffect } from '~/features/simulation/api/useSimulationSideeffect'
import { useAuthFacade } from './useAuthFacade'
import { useWeatherFacade } from './useWeatherFacade'
import { useMapLayersFacade } from './useMapLayersFacade'

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

    // ─── 하위 퍼사드 조합 ────────────────────────────────────────────
    const { authStore, authEffect } = useAuthFacade()
    const { weather, weatherSources, initWeather, weatherRecommend, weatherRecommendEffect } =
        useWeatherFacade({ viewer })
    const {
        facility,
        sidewalk,
        facilityEffect,
        boundary,
        boundaryEffect,
        elevation,
        elevationEffect,
        gradient,
        gradientEffect
    } = useMapLayersFacade({
        viewer,
        drawing,
        routeDrawStore,
        notification,
        hideRoutePolylines,
        showRoutePolylines
    })

    // ─── 카메라 정보 ─────────────────────────────────────────────────
    const camera = useCameraStore()
    const cameraEffect = useCameraSideeffect({ viewer, ...camera })

    // ─── 탐색 ────────────────────────────────────────────────────────
    const explore = useExploreSearchSideeffect()

    // ─── 시뮬레이션 ──────────────────────────────────────────────────
    const simulation = useSimulationStore()
    const simulationEffect = useSimulationSideeffect({ viewer })

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
        auth: { authStore, authEffect },
        weather: {
            store: weather,
            sources: weatherSources,
            recommend: weatherRecommend,
            recommendEffect: weatherRecommendEffect,
            initWeather
        },
        mapLayers: {
            facility,
            sidewalk,
            facilityEffect,
            boundary,
            boundaryEffect,
            elevation,
            elevationEffect,
            gradient,
            gradientEffect
        },
        camera,
        explore,
        simulation: { store: simulation, effect: simulationEffect }
    }
}
