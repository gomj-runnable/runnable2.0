import type { RouteCompareResponse } from '#shared/types/route-compare'

/**
 * 경로 비교 상태 store (#187).
 *
 * 비교할 두 경로의 ID와 `/api/routes/compare` 응답을 보관한다.
 * UI 측에서 selector 가 ID 를 채우고 sideeffect 가 응답을 채운다.
 */
export const useRouteCompareStore = () => {
    const routeIdA = useState<string | null>('routeCompare.routeIdA', () => null)
    const routeIdB = useState<string | null>('routeCompare.routeIdB', () => null)
    const result = useState<RouteCompareResponse | null>('routeCompare.result', () => null)
    const isLoading = useState<boolean>('routeCompare.isLoading', () => false)

    const reset = () => {
        routeIdA.value = null
        routeIdB.value = null
        result.value = null
    }

    return { routeIdA, routeIdB, result, isLoading, reset }
}
