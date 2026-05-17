import type {
    CurationCollectionDraftInput,
    SavedCurationCollection,
    CurationRouteDraftInput,
    SavedCurationRoute
} from '#shared/types/curation'

export interface ICurationRepository {
    createCollection(
        input: CurationCollectionDraftInput,
        createdBy: string
    ): Promise<SavedCurationCollection>
    getCollection(collectionId: string): Promise<SavedCurationCollection | null>
    listActiveCollections(today: string): Promise<SavedCurationCollection[]>
    listAllCollections(): Promise<SavedCurationCollection[]>
    deleteCollection(collectionId: string): Promise<boolean>

    addRoute(collectionId: string, input: CurationRouteDraftInput): Promise<SavedCurationRoute>
    listRoutes(collectionId: string): Promise<SavedCurationRoute[]>
    removeRoute(curationRouteId: string): Promise<boolean>
}
