import type {
    SegmentDraftInput,
    SavedSegment,
    SegmentEffortDraftInput,
    SavedSegmentEffort,
    SegmentLeaderboard
} from '#shared/types/segment'

export interface ISegmentRepository {
    createSegment(input: SegmentDraftInput, ownerId: string): Promise<SavedSegment>
    getSegment(segmentId: string): Promise<SavedSegment | null>
    listPublicSegments(): Promise<SavedSegment[]>
    listSegmentsByRoute(routeId: string): Promise<SavedSegment[]>
    listSegmentsByOwner(ownerId: string): Promise<SavedSegment[]>
    deleteSegment(segmentId: string): Promise<boolean>

    createEffort(input: SegmentEffortDraftInput, userId: string): Promise<SavedSegmentEffort>
    getLeaderboard(segmentId: string, userId?: string, limit?: number): Promise<SegmentLeaderboard>
    listEffortsByUser(userId: string): Promise<SavedSegmentEffort[]>
}
