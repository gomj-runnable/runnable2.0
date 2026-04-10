import type { SavedRoute, SavedSection } from '#shared/types/route'

export const useExploreSearchSideeffect = () => {
    const searchResults = useState<SavedRoute[]>('explore-search-results', () => [])
    const searchQuery = useState('explore-search-query', () => '')
    const isSearching = useState('explore-is-searching', () => false)
    const selectedRouteId = useState<string | null>('explore-selected-route', () => null)

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

    const fetchSections = async (routeId: string): Promise<SavedSection[]> => {
        return $fetch<SavedSection[]>(`/api/routes/${routeId}/sections`)
    }

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
