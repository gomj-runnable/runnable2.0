import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'

/**
 * 경로 닫기 모드(루프/왕복) 관련 상태를 제공하는 sub-facade.
 */
export const useRouteClosingFacade = () => {
    const store = useRouteDrawStore()

    const closing = reactive({
        mode: store.closingMode,
        setMode: store.setClosingMode,
        isLoopClose: store.isLoopClose,
        isRoundTrip: store.isRoundTrip
    })

    return { closing }
}
