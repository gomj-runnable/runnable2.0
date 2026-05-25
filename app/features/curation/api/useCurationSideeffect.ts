import type { SavedCurationCollection, SavedCurationRoute } from '#shared/types/curation'
import type { SavedRoute } from '#shared/types/route'

/**
 * 큐레이션(시즌·테마 컬렉션) 부수효과.
 * - 활성 컬렉션 목록 로드
 * - 특정 컬렉션의 routes(curation routes + 실제 SavedRoute) 로드
 */
export function useCurationSideeffect() {
    const collections = useState<SavedCurationCollection[]>('curation-active', () => [])
    const isLoadingCollections = useState('curation-loading', () => false)
    const selectedCollectionId = useState<string | null>('curation-selected', () => null)
    const collectionRoutes = useState<SavedRoute[]>('curation-routes', () => [])
    const isLoadingRoutes = useState('curation-routes-loading', () => false)

    const loadActiveCollections = async () => {
        isLoadingCollections.value = true
        try {
            collections.value = await $fetch<SavedCurationCollection[]>('/api/curation/active')
        } catch {
            collections.value = []
        } finally {
            isLoadingCollections.value = false
        }
    }

    const selectCollection = async (collectionId: string | null) => {
        if (collectionId === selectedCollectionId.value) {
            selectedCollectionId.value = null
            collectionRoutes.value = []
            return
        }
        selectedCollectionId.value = collectionId
        if (!collectionId) {
            collectionRoutes.value = []
            return
        }
        isLoadingRoutes.value = true
        try {
            const curationRoutes = await $fetch<SavedCurationRoute[]>(
                `/api/curation/${collectionId}/routes`
            )
            const routes = await Promise.all(
                curationRoutes.map((r) =>
                    $fetch<{ route: SavedRoute } | null>(`/api/routes/share/${r.routeId}`).catch(
                        () => null
                    )
                )
            )
            collectionRoutes.value = routes
                .filter((r): r is { route: SavedRoute } => !!r)
                .map((r) => r.route)
        } catch {
            collectionRoutes.value = []
        } finally {
            isLoadingRoutes.value = false
        }
    }

    return {
        collections,
        isLoadingCollections,
        selectedCollectionId,
        collectionRoutes,
        isLoadingRoutes,
        loadActiveCollections,
        selectCollection
    }
}
