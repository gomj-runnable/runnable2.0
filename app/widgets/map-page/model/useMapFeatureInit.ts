/** 지도 초기화 및 인증·레이어·카메라 등 핵심 기능을 onMounted 에서 병렬로 부트스트랩하는 composable. */
import { onScopeDispose } from 'vue'
import { useMapInit } from '~/shared/lib/cesium/lifecycle/useMapInit'
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'
import {
    isBuildingPick,
    findNearestGroundPosition
} from '~/features/camera/lib/useBuildingDetection'
import { useCameraStore } from '~/shared/model/useCameraStore'
import { useCameraSideeffect } from '~/features/camera/api/useCameraSideeffect'
import type { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import type { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import type { useRouteMapFacade } from './useRouteMapFacade'
import { useAuthFacade } from './useAuthFacade'
import { useMapLayersFacade } from './useMapLayersFacade'

type RouteDrawStore = ReturnType<typeof useRouteDrawStore>
type NotificationStore = ReturnType<typeof useNotificationStore>
type RouteMapFacadeReturn = ReturnType<typeof useRouteMapFacade>
type DrawingFacade = RouteMapFacadeReturn['drawing']

interface UseMapFeatureInitOptions {
    drawing: DrawingFacade
    routeDrawStore: RouteDrawStore
    notification: NotificationStore
    hideRoutePolylines: () => void
    showRoutePolylines: () => void
    /** districtEffect.getters() 등 외부 init을 onMounted에 추가 */
    additionalInits?: (() => Promise<unknown>)[]
}

export function useMapFeatureInit({
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
        },
        buildingPickHelpers: { isBuildingPick, findNearestGroundPosition }
    })

    // ─── 하위 퍼사드 조합 ────────────────────────────────────────────
    const { authStore, authEffect } = useAuthFacade()
    const {
        facility,
        facilityEffect,
        boundary,
        boundaryEffect,
        elevation,
        elevationEffect,
        gradient,
        gradientEffect
    } = useMapLayersFacade({
        drawing,
        routeDrawStore,
        notification,
        hideRoutePolylines,
        showRoutePolylines
    })

    // ─── 카메라 정보 ─────────────────────────────────────────────────
    const camera = useCameraStore()
    const cameraEffect = useCameraSideeffect({ ...camera })

    // unmount 시 camera.moveEnd 리스너 정리 (getters() 만 호출되고 destroy() 누락 보완)
    onScopeDispose(() => cameraEffect.destroy())

    // ─── 마운트: 지도 초기화 → 각 기능 병렬 로드 ─────────────────────
    onMounted(async () => {
        await init()
        useMapViewer().setViewer(window.viewer)
        await Promise.all([
            authEffect.fetchSession(),
            cameraEffect.init(),
            boundaryEffect.init(),
            elevationEffect.init(),
            gradientEffect.init(),
            ...additionalInits.map((fn) => fn())
        ])
    })

    return {
        auth: { authStore, authEffect },
        mapLayers: {
            facility,
            facilityEffect,
            boundary,
            boundaryEffect,
            elevation,
            elevationEffect,
            gradient,
            gradientEffect
        },
        camera
    }
}
