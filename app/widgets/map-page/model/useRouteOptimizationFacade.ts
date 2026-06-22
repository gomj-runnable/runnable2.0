import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useRouteOptimizationSideeffect } from '~/features/draw-route/api/useRouteOptimizationSideeffect'

/**
 * 경로 최적화(보행자 경로 보정) 관련 기능을 제공하는 sub-facade.
 */
export const useRouteOptimizationFacade = () => {
    const store = useRouteDrawStore()

    const optimizationEffect = useRouteOptimizationSideeffect({
        isOptimizing: store.isOptimizing
    })

    return {
        optimizationEffect,
        optimizationMode: store.optimizationMode,
        isOptimizing: store.isOptimizing
    }
}
