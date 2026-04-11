import type { SavedRoute, SavedSection } from '#shared/types/route'

/**
 * 탐색 탭에서 공개 경로를 검색하고 결과를 관리하는 sideeffect composable.
 * 검색어·로딩 상태·선택 경로 ID를 `useState`로 공유하여 탐색 UI 전반에서 접근 가능하다.
 */
export const useExploreSearchSideeffect = () => {
    /** 검색 결과로 반환된 공개 경로 목록 */
    const searchResults = useState<SavedRoute[]>('explore-search-results', () => [])
    /** 현재 검색 입력값 */
    const searchQuery = useState('explore-search-query', () => '')
    /** 검색 API 호출 중 여부 */
    const isSearching = useState('explore-is-searching', () => false)
    /** 탐색 탭에서 현재 선택된 경로 ID. 선택 없음이면 `null`. */
    const selectedRouteId = useState<string | null>('explore-selected-route', () => null)

    /**
     * 공개 경로를 검색하여 `searchResults`를 갱신한다.
     * 쿼리가 없거나 빈 문자열이면 전체 목록을 반환한다.
     *
     * @param query - 검색어. 없으면 전체 조회.
     */
    const search = async (query?: string) => {
        isSearching.value = true
        try {
            const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
            searchResults.value = await $fetch<SavedRoute[]>(`/api/routes/search${params}`)
        } catch {
            searchResults.value = []
        } finally {
            isSearching.value = false
        }
    }

    /**
     * 특정 경로의 구간 목록을 서버에서 가져온다.
     *
     * @param routeId - 구간을 조회할 경로 ID
     * @returns 저장된 구간 배열
     */
    const fetchSections = async (routeId: string): Promise<SavedSection[]> => {
        return $fetch<SavedSection[]>(`/api/routes/${routeId}/sections`)
    }

    /**
     * 경로를 선택하거나 이미 선택된 경로를 클릭하면 선택을 해제한다.
     *
     * @param routeId - 선택할 경로 ID
     */
    const selectRoute = (routeId: string) => {
        selectedRouteId.value = selectedRouteId.value === routeId ? null : routeId
    }

    return {
        searchResults,
        searchQuery,
        isSearching,
        selectedRouteId,
        search,
        fetchSections,
        selectRoute
    }
}
