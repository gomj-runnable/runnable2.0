import { useRouteOptimizationSideeffect } from '~/features/draw-route/api/useRouteOptimizationSideeffect'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'

/**
 * 경로 최적화(보행자 보정 등) sideeffect를 단일 책임 단위로 노출하는 facade.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 */
export const useRouteOptimizationFacade = () => {
    const store = useRouteDrawStore()
    const effect = useRouteOptimizationSideeffect({
        isOptimizing: store.isOptimizing
    })
    return {
        mode: store.optimizationMode,
        isOptimizing: store.isOptimizing,
        optimizeRoute: effect.optimizeRoute
    }
}
