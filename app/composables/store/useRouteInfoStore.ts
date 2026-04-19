import type { SavedRouteInfo, RouteInfoDraftInput } from '#shared/types/routeInfo'

/**
 * 경로정보 상태를 관리하는 store composable.
 * 서버 저장된 경로정보(routeInfos)와 로컬 미저장 경로정보(localRouteInfos)를 분리 관리한다.
 */
export const useRouteInfoStore = () => {
    /** 서버에서 불러온 저장된 경로정보 목록 */
    const routeInfos = useState<SavedRouteInfo[]>('routeInfo.data', () => [])
    /** 그리기 중 로컬에만 존재하는 미저장 경로정보 목록 */
    const localRouteInfos = useState<RouteInfoDraftInput[]>('routeInfo.localData', () => [])
    /** 경로정보 추가 모드 활성 여부 (지도 클릭으로 위치 지정) */
    const isAddingRouteInfo = useState<boolean>('routeInfo.isAdding', () => false)
    /** 마커 클릭으로 선택된 경로정보 (팝업 표시용) */
    const selectedMarkerRouteInfo = useState<(SavedRouteInfo | RouteInfoDraftInput) | null>('routeInfo.selectedMarker', () => null)
    /** 경로정보 데이터 로딩 중 여부 */
    const isLoading = useState<boolean>('routeInfo.isLoading', () => false)

    /** 경로정보 추가 모드를 토글한다 */
    const toggleAddingMode = () => {
        isAddingRouteInfo.value = !isAddingRouteInfo.value
        if (!isAddingRouteInfo.value) {
            selectedMarkerRouteInfo.value = null
        }
    }

    /** 로컬 경로정보를 추가한다 (미저장 상태) */
    const addLocalRouteInfo = (item: RouteInfoDraftInput) => {
        localRouteInfos.value = [...localRouteInfos.value, item]
    }

    /** 로컬 경로정보 목록을 초기화한다 */
    const clearLocalRouteInfos = () => {
        localRouteInfos.value = []
    }

    /** 모든 경로정보 상태를 초기화한다 */
    const clearRouteInfos = () => {
        routeInfos.value = []
        localRouteInfos.value = []
        selectedMarkerRouteInfo.value = null
        isAddingRouteInfo.value = false
    }

    return {
        routeInfos,
        localRouteInfos,
        isAddingRouteInfo,
        selectedMarkerRouteInfo,
        isLoading,
        toggleAddingMode,
        addLocalRouteInfo,
        clearLocalRouteInfos,
        clearRouteInfos
    }
}
