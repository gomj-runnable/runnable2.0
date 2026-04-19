/**
 * 경로 마감 모드(도착지 연결 / 왕복 코스)의 상호 배타 상태를 관리하는 store composable.
 * 하나가 활성화되면 다른 하나는 자동으로 꺼지며, 둘 다 꺼진 상태도 허용한다.
 */

import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

export { RouteClosingModeEnum }
export type RouteClosingMode = RouteClosingModeEnum | null

export const useRouteClosingStore = () => {
    /** 현재 활성화된 마감 모드. 비활성 상태이면 `null`. */
    const closingMode = useState<RouteClosingMode>('route-closing-mode', () => null)

    /** loop-close 모드가 활성인지 여부 */
    const isLoopClose = computed(() => closingMode.value?.isLoopClose ?? false)
    /** round-trip 모드가 활성인지 여부 */
    const isRoundTrip = computed(() => closingMode.value?.isRoundTrip ?? false)

    /**
     * 마감 모드를 토글한다.
     * 현재 활성 모드와 동일하면 끄고, 다르면 전환한다.
     */
    const setClosingMode = (mode: RouteClosingMode) => {
        if (!mode) { closingMode.value = null; return }
        closingMode.value = closingMode.value?.equals(mode) ? null : mode
    }

    /** 마감 모드를 비활성(`null`) 상태로 초기화한다. */
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
