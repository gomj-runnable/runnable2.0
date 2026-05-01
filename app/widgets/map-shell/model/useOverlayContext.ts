import { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'
import type { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import type { useSimulationStore } from '~/features/simulation/model/useSimulationStore'
import type { useSimulationSideeffect } from '~/features/simulation/api/useSimulationSideeffect'
import type { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'
import type { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'

interface OverlayContextOptions {
    activeNav: Ref<string>
    sectionDraft: ComputedRef<unknown> | { value: unknown }
    selectedRouteId: string | null | Ref<string | null>
    exploreSelectedRouteId: Ref<string | null>
    showRecommend: Ref<boolean>
    routeInfoStore: ReturnType<typeof useRouteInfoStore>
    routeInfoEffect: ReturnType<typeof useRouteInfoSideeffect>
    simulation: ReturnType<typeof useSimulationStore>
    simulationEffect: ReturnType<typeof useSimulationSideeffect>
    isSimDrawerOpen: Ref<boolean>
    sectionInfo: ReturnType<typeof useSectionInfoStore>
}

/**
 * 현재 탭·선택 상태·추천 모드에 따라 오버레이 UI 그룹의 표출 컨텍스트를 결정한다.
 * overlayContext 변경 시 연관 UI(경로정보, 시뮬레이션)를 일괄 정리한다.
 */
export const useOverlayContext = (options: OverlayContextOptions) => {
    const {
        activeNav,
        sectionDraft,
        selectedRouteId,
        exploreSelectedRouteId,
        showRecommend,
        routeInfoStore,
        routeInfoEffect,
        simulation,
        simulationEffect,
        isSimDrawerOpen,
        sectionInfo
    } = options

    const overlayContext = computed<MapOverlayContextEnum>(() => {
        if (activeNav.value === '그리기' && sectionDraft.value) {
            return MapOverlayContextEnum.DRAWING
        }
        const resolvedRouteId =
            selectedRouteId && typeof selectedRouteId === 'object' && 'value' in selectedRouteId
                ? selectedRouteId.value
                : selectedRouteId
        if (activeNav.value === '목록' && resolvedRouteId) {
            return MapOverlayContextEnum.LIST_SELECTED
        }
        if (activeNav.value === '탐색') {
            if (showRecommend.value) return MapOverlayContextEnum.RECOMMEND
            if (exploreSelectedRouteId.value) return MapOverlayContextEnum.EXPLORE_SELECTED
        }
        return MapOverlayContextEnum.NONE
    })

    /** 경로정보 Chip 표출 조건: overlayContext에 활성 경로가 있을 때 */
    const showRouteInfoChip = computed(() => overlayContext.value.hasActiveRoute)

    /** 시뮬레이션 Chip 표출 조건: 활성 경로 + 목록 탭에서는 구간정보 열림 필요 */
    const showSimulationChip = computed(() => {
        if (!overlayContext.value.hasActiveRoute) return false
        if (overlayContext.value.isListSelected) return sectionInfo.isOpen.value
        return true
    })

    /**
     * 오버레이 컨텍스트가 바뀌면 이전 컨텍스트에서 활성화된 상호작용 UI를 일괄 정리한다.
     * - 경로정보 추가 모드 해제
     * - 시뮬레이션 Drawer 닫기 + 재생 정지
     * - 경로정보 마커 팝업 닫기
     */
    watch(overlayContext, (next, prev) => {
        if (next.key === prev.key) return

        if (!next.hasActiveRoute) {
            if (routeInfoStore.isAddingRouteInfo.value) {
                routeInfoEffect.cancelAdding()
            }
            isSimDrawerOpen.value = false
            if (!simulation.playbackState.value.isStopped) {
                simulationEffect.stopPlayback()
            }
            routeInfoStore.selectedMarkerRouteInfo.value = null
        }
    })

    return { overlayContext, showRouteInfoChip, showSimulationChip }
}
