/**
 * 세그먼트 — 경로의 일부분을 등록하여 다른 사용자들과 시간 비교.
 * #147 참고.
 */

export interface SegmentBase {
    name: string
    description?: string
    /** 원본 경로 ID */
    routeId: string
    /** 경로 내 시작 position index */
    startPositionIndex: number
    /** 경로 내 종료 position index */
    endPositionIndex: number
    /** 구간 거리 (km) */
    distanceKm: number
    /** 누적 상승 (m) */
    elevationGainM?: number
    /** 공개 여부 */
    isPublic?: boolean
}

export type SegmentDraftInput = SegmentBase

export interface SavedSegment extends SegmentBase {
    segmentId: string
    ownerId: string
    ownerName?: string
    createdAt: string
    effortCount: number
}

export interface SegmentEffortBase {
    segmentId: string
    /** 소요 시간 (초) */
    durationSec: number
    /** 평균 페이스 (초/km) */
    paceSecPerKm: number
}

export type SegmentEffortDraftInput = SegmentEffortBase

export interface SavedSegmentEffort extends SegmentEffortBase {
    effortId: string
    userId: string
    userName?: string
    completedAt: string
}

export interface SegmentLeaderboard {
    segmentId: string
    segmentName: string
    distanceKm: number
    top: SavedSegmentEffort[]
    userRank: number | null
    userBest: SavedSegmentEffort | null
    totalEfforts: number
}
