import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useRouteListSideeffect } from '~/features/draw-route/api/useRouteListSideeffect'

/**
 * 경로 목록 조회·선택·검색 기능을 제공하는 sub-facade.
 *
 * select/download는 교차 의존성이 있으므로 오케스트레이터(useRouteMapFacade)에서 주입한다.
 */
export const useRouteListFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useRouteDrawStore()

    const listEffect = useRouteListSideeffect({
        viewer,
        routes: store.routes,
        selectedRouteId: store.selectedRouteId,
        drawnPositions: store.drawnPositions
    })

    /** 검색어로 필터링된 경로 목록 */
    const filteredRoutes = computed(() =>
        store.routes.value.filter((r) => r.title.includes(store.searchQuery.value))
    )

    return {
        listEffect,
        filteredRoutes,
        searchQuery: store.searchQuery,
        selectedRouteId: store.selectedRouteId
    }
}
