import { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'
import type { useRouteInfoStore } from '~/entities/route/model/useRouteInfoStore'
import type { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'

interface OverlayContextOptions {
    activeNav: Ref<string>
    sectionDraft: ComputedRef<unknown> | { value: unknown }
    selectedRouteId: string | null | Ref<string | null>
    exploreSelectedRouteId: Ref<string | null>
    routeInfoStore: ReturnType<typeof useRouteInfoStore>
    routeInfoEffect: ReturnType<typeof useRouteInfoSideeffect>
}

/**
 * 현재 탭·선택 상태에 따라 오버레이 UI 그룹의 표출 컨텍스트를 결정한다.
 * overlayContext 변경 시 연관 UI(경로정보)를 일괄 정리한다.
 */
export const useOverlayContext = (options: OverlayContextOptions) => {
    const {
        activeNav,
        sectionDraft,
        selectedRouteId,
        exploreSelectedRouteId,
        routeInfoStore,
        routeInfoEffect
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
        // 탐색은 sidepanel 플러그인으로 분리되어 activeNav 에 묶이지 않는다.
        // 플러그인에서 경로를 선택하면(공유 useState) 미리보기 컨텍스트를 표출한다.
        if (exploreSelectedRouteId.value) {
            return MapOverlayContextEnum.EXPLORE_SELECTED
        }
        return MapOverlayContextEnum.NONE
    })

    /** 경로정보 Chip 표출 조건: overlayContext에 활성 경로가 있을 때 */
    const showRouteInfoChip = computed(() => overlayContext.value.hasActiveRoute)

    /**
     * 오버레이 컨텍스트가 바뀌면 이전 컨텍스트에서 활성화된 상호작용 UI를 일괄 정리한다.
     * - 경로정보 추가 모드 해제
     * - 경로정보 마커 팝업 닫기
     */
    watch(overlayContext, (next, prev) => {
        if (next.key === prev.key) return

        if (!next.hasActiveRoute) {
            if (routeInfoStore.isAddingRouteInfo.value) {
                routeInfoEffect.cancelAdding()
            }
            routeInfoStore.selectedMarkerRouteInfo.value = null
        }
    })

    return { overlayContext, showRouteInfoChip }
}
