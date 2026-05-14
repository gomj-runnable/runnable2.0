import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useRouteClosingSideeffect } from '~/features/draw-route/api/useRouteClosingSideeffect'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'

/**
 * 경로 닫기(loop close / round trip) sideeffect를 단일 책임 단위로 노출하는 facade.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 */
export const useRouteClosingFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useRouteDrawStore()
    const effect = useRouteClosingSideeffect({
        viewer,
        drawnPositions: store.drawnPositions,
        closingMode: store.closingMode
    })

    return {
        mode: store.closingMode,
        setMode: store.setClosingMode,
        isLoopClose: store.isLoopClose,
        isRoundTrip: store.isRoundTrip,
        clearClosingPreview: effect.clearClosingPreview
    }
}
