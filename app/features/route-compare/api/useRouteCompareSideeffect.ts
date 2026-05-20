import type { RouteCompareResponse } from '#shared/types/route-compare'
import { useRouteCompareStore } from '~/features/route-compare/model/useRouteCompareStore'

/**
 * `/api/routes/compare` 호출 sideeffect (#187).
 *
 * store 에 채워진 `routeIdA` / `routeIdB` 가 모두 존재하면 비교 API 를 호출해 `result` 에 응답을 채운다.
 */
export const useRouteCompareSideeffect = () => {
    const store = useRouteCompareStore()

    const fetchCompare = async (): Promise<RouteCompareResponse | null> => {
        const routeA = store.routeIdA.value
        const routeB = store.routeIdB.value
        if (!routeA || !routeB) return null

        store.isLoading.value = true
        try {
            const data = await $fetch<RouteCompareResponse>('/api/routes/compare', {
                query: { routeA, routeB }
            })
            store.result.value = data
            return data
        } catch (e) {
            console.error('[RouteCompareSideeffect] 비교 API 실패:', e)
            store.result.value = null
            return null
        } finally {
            store.isLoading.value = false
        }
    }

    return { fetchCompare }
}
