import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useRouteListSideeffect } from '~/features/draw-route/api/useRouteListSideeffect'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'

/**
 * 경로 목록 조회·선택·미리보기 sideeffect를 단일 책임 단위로 노출하는 facade.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 */
export const useRouteListFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useRouteDrawStore()
    const effect = useRouteListSideeffect({
        viewer,
        routes: store.routes,
        selectedRouteId: store.selectedRouteId,
        drawnPositions: store.drawnPositions
    })

    const filteredRoutes = computed(() =>
        store.routes.value.filter((r) => r.title.includes(store.searchQuery.value))
    )

    return {
        routes: store.routes,
        filteredRoutes,
        selectedRouteId: store.selectedRouteId,
        searchQuery: store.searchQuery,
        fetchRoutes: effect.fetchRoutes,
        fetchRouteSections: effect.fetchRouteSections,
        selectRoute: effect.selectRoute,
        clearPreview: effect.clearPreview,
        clearSelection: effect.clearSelection,
        hidePreviewPolylines: effect.hidePreviewPolylines,
        showPreviewPolylines: effect.showPreviewPolylines
    }
}
