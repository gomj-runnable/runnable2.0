import type { RouteCompareResponse } from '#shared/types/route-compare'

/**
 * 두 경로 비교 부수효과 (#188).
 * 두 routeId 를 모으는 selectionRing 와 `/api/routes/compare` 호출 결과를 함께 관리.
 */
export function useRouteCompareSideeffect() {
    const pendingRouteId = useState<string | null>('route-compare-pending', () => null)
    const result = useState<RouteCompareResponse | null>('route-compare-result', () => null)
    const isLoading = useState('route-compare-loading', () => false)
    const errorMessage = useState<string | null>('route-compare-error', () => null)
    const isOpen = useState('route-compare-modal-open', () => false)

    const pickRoute = async (routeId: string) => {
        errorMessage.value = null
        if (!pendingRouteId.value) {
            pendingRouteId.value = routeId
            return { needsSecond: true }
        }
        if (pendingRouteId.value === routeId) {
            pendingRouteId.value = null
            return { needsSecond: false }
        }
        const routeA = pendingRouteId.value
        const routeB = routeId
        pendingRouteId.value = null
        isLoading.value = true
        isOpen.value = true
        try {
            result.value = await $fetch<RouteCompareResponse>('/api/routes/compare', {
                query: { routeA, routeB }
            })
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'statusMessage' in err
                    ? String((err as { statusMessage?: unknown }).statusMessage ?? '')
                    : ''
            errorMessage.value = msg || '비교 요청에 실패했습니다.'
            result.value = null
        } finally {
            isLoading.value = false
        }
        return { needsSecond: false }
    }

    const close = () => {
        isOpen.value = false
        result.value = null
        errorMessage.value = null
    }

    const cancelPending = () => {
        pendingRouteId.value = null
    }

    return {
        pendingRouteId,
        result,
        isLoading,
        errorMessage,
        isOpen,
        pickRoute,
        close,
        cancelPending
    }
}
