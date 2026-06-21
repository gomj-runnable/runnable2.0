import type { SavedRouteInfo, RouteInfoCreateInput } from '#shared/types/routeInfo'

/**
 * 경로정보 상태를 관리하는 store composable.
 * 서버 저장된 경로정보(routeInfos)와 미저장 초안 경로정보(draftRouteInfos)를 분리 관리한다.
 * @example
 * ```ts
 * const routeInfoStore = useRouteInfoStore()
 *
 * // 지도 클릭으로 위치를 찍기 위해 추가 모드를 켠다
 * routeInfoStore.toggleAddingMode()
 *
 * // 아직 서버에 저장하지 않은 경로정보를 로컬에 쌓는다
 * routeInfoStore.addDraftRouteInfo({
 *     name: '급수대',
 *     description: '5km 지점',
 *     geom: { type: 'Point', coordinates: [127.02, 37.5] }
 * })
 *
 * // 경로 선택이 바뀌는 등 컨텍스트를 떠날 때 전체 상태를 비운다
 * routeInfoStore.clearRouteInfos()
 * ```
 */
export const useRouteInfoStore = () => {
    /** 서버에서 불러온 저장된 경로정보 목록 */
    const routeInfos = useState<SavedRouteInfo[]>('routeInfo.data', () => [])
    /** 그리기 중 로컬에만 존재하는 미저장 초안 경로정보 목록 */
    const draftRouteInfos = useState<RouteInfoCreateInput[]>('routeInfo.draftData', () => [])
    /** 경로정보 추가 모드 활성 여부 (지도 클릭으로 위치 지정) */
    const isAddingRouteInfo = useState<boolean>('routeInfo.isAdding', () => false)
    /** 마커 클릭으로 선택된 경로정보 (팝업 표시용) */
    const selectedMarkerRouteInfo = useState<(SavedRouteInfo | RouteInfoCreateInput) | null>(
        'routeInfo.selectedMarker',
        () => null
    )
    /** 경로정보 데이터 로딩 중 여부 */
    const isLoading = useState<boolean>('routeInfo.isLoading', () => false)

    /** 경로정보 추가 모드를 토글한다 */
    const toggleAddingMode = () => {
        isAddingRouteInfo.value = !isAddingRouteInfo.value
        if (!isAddingRouteInfo.value) {
            selectedMarkerRouteInfo.value = null
        }
    }

    /** 미저장 초안 경로정보를 추가한다 */
    const addDraftRouteInfo = (item: RouteInfoCreateInput) => {
        draftRouteInfos.value = [...draftRouteInfos.value, item]
    }

    /** 미저장 초안 경로정보 목록을 초기화한다 */
    const clearDraftRouteInfos = () => {
        draftRouteInfos.value = []
    }

    /** 모든 경로정보 상태를 초기화한다 */
    const clearRouteInfos = () => {
        routeInfos.value = []
        draftRouteInfos.value = []
        selectedMarkerRouteInfo.value = null
        isAddingRouteInfo.value = false
    }

    return {
        routeInfos,
        draftRouteInfos,
        isAddingRouteInfo,
        selectedMarkerRouteInfo,
        isLoading,
        toggleAddingMode,
        addDraftRouteInfo,
        clearDraftRouteInfos,
        clearRouteInfos
    }
}
