/**
 * 경로 마감 모드(도착지 연결 / 왕복 코스)의 상호 배타 상태를 관리하는 store composable.
 * 하나가 활성화되면 다른 하나는 자동으로 꺼지며, 둘 다 꺼진 상태도 허용한다.
 */

export type RouteClosingMode = 'loop-close' | 'round-trip' | null

export const useRouteClosingStore = () => {
    const closingMode = useState<RouteClosingMode>('route-closing-mode', () => null)

    const isLoopClose = computed(() => closingMode.value === 'loop-close')
    const isRoundTrip = computed(() => closingMode.value === 'round-trip')

    /**
     * 마감 모드를 토글한다.
     * 현재 활성 모드와 동일하면 끄고, 다르면 전환한다.
     */
    const setClosingMode = (mode: RouteClosingMode) => {
        closingMode.value = closingMode.value === mode ? null : mode
    }

    const resetClosingMode = () => {
        closingMode.value = null
    }

    return {
        closingMode,
        isLoopClose,
        isRoundTrip,
        setClosingMode,
        resetClosingMode
    }
}
