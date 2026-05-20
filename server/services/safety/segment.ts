/**
 * 경로 세그먼트 단위 안전 점수 계산 (#196).
 *
 * 1) 경로 좌표 배열을 일정 거리로 분할한 RouteSegment 목록을 만든다.
 * 2) 외부 위험 데이터 소스(accident/crime/lighting/ugc) 의 측정값을 세그먼트 단위로 묶는다.
 * 3) #195 정규화 엔진으로 소스별 z-score → 안전 점수를 산출한 뒤 가중 합산해 세그먼트 종합 점수를 만든다.
 *
 * 실제 외부 데이터(#193)는 PoC 단계에서 입력으로 주입한다. 가중치는 #197 학습 전까지 균등(25%×4).
 */

import { length as turfLength, lineString as turfLineString } from '@turf/turf'
import type { Position } from 'geojson'
import { computeStats, normalize, zScoreToSafetyScore } from './normalize'
import type { NormalizedSafetyScore, SafetyDataSource } from './types'

/** PoC 기본 세그먼트 분할 길이 (m). */
export const DEFAULT_SEGMENT_LENGTH_M = 100

/** PoC 기본 균등 가중치 (4 소스 × 0.25). */
export const DEFAULT_SAFETY_WEIGHTS: Record<SafetyDataSource, number> = {
    accident: 0.25,
    crime: 0.25,
    lighting: 0.25,
    ugc: 0.25
}

/**
 * 세그먼트 분할 결과 항목.
 * `coords` 는 시작·끝 좌표를 포함하며, 인접 세그먼트와 끝점을 공유한다.
 */
export interface RouteSegment {
    index: number
    coords: Position[]
    startKm: number
    endKm: number
    centroid: Position
}

/**
 * 세그먼트 단위로 누적된 소스별 원시 측정값.
 * 4개 소스 모두 채워질 필요는 없으며, 데이터 부재 소스는 생략된다.
 */
export interface SegmentSourceSamples {
    segmentIndex: number
    samplesBySource: Partial<Record<SafetyDataSource, number[]>>
}

/**
 * 세그먼트 종합 안전 점수.
 * `sourceScores` 는 소스별 정규화 결과를, `compositeScore` 는 가중 합산 결과를 담는다.
 */
export interface SegmentSafetyResult {
    segmentIndex: number
    sourceScores: Partial<Record<SafetyDataSource, NormalizedSafetyScore>>
    compositeScore: number
}

const distanceKm = (a: Position, b: Position): number => {
    const aLng = a[0]
    const aLat = a[1]
    const bLng = b[0]
    const bLat = b[1]
    if (aLng === undefined || aLat === undefined || bLng === undefined || bLat === undefined) {
        return 0
    }
    return turfLength(turfLineString([a, b]), { units: 'kilometers' })
}

/**
 * 좌표 배열을 `segmentLengthM` 미터 간격으로 분할한다.
 * 좌표 사이 거리가 분할 길이보다 길더라도 추가 보간은 하지 않으며,
 * 분할 경계가 다음 좌표를 지나면 그 좌표까지 묶는 단순 누적 방식이다.
 */
export function splitRouteIntoSegments(
    coords: Position[],
    segmentLengthM: number = DEFAULT_SEGMENT_LENGTH_M
): RouteSegment[] {
    if (coords.length < 2 || segmentLengthM <= 0) return []

    const segments: RouteSegment[] = []
    const targetKm = segmentLengthM / 1000

    let cumulativeKm = 0
    let segStartKm = 0
    let segCoords: Position[] = [coords[0]!]

    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1]!
        const curr = coords[i]!
        cumulativeKm += distanceKm(prev, curr)
        segCoords.push(curr)

        const segLen = cumulativeKm - segStartKm
        const isLast = i === coords.length - 1
        if (segLen >= targetKm || isLast) {
            const centroid = segCoords[Math.floor(segCoords.length / 2)]!
            segments.push({
                index: segments.length,
                coords: segCoords,
                startKm: segStartKm,
                endKm: cumulativeKm,
                centroid
            })
            segStartKm = cumulativeKm
            segCoords = [curr]
        }
    }

    return segments
}

/**
 * 세그먼트별 소스 측정값을 정규화하고 가중 합산해 종합 안전 점수를 계산한다.
 *
 * 정규화 통계는 "**전체 세그먼트에 걸친 소스별 측정값**" 으로 산출한다.
 * 따라서 같은 소스라도 다른 경로/구간 데이터와 비교 시 점수가 달라질 수 있다.
 *
 * @param samplesPerSegment 세그먼트별 소스 측정값 집합
 * @param weights 소스별 가중치 (기본 균등 0.25). 합이 0 이면 균등으로 폴백.
 */
export function computeSegmentSafetyScores(
    samplesPerSegment: SegmentSourceSamples[],
    weights: Record<SafetyDataSource, number> = DEFAULT_SAFETY_WEIGHTS
): SegmentSafetyResult[] {
    const sources: SafetyDataSource[] = ['accident', 'crime', 'lighting', 'ugc']

    const statsBySource: Partial<Record<SafetyDataSource, ReturnType<typeof computeStats>>> = {}
    for (const source of sources) {
        const all = samplesPerSegment.flatMap((s) => s.samplesBySource[source] ?? [])
        if (all.length > 0) statsBySource[source] = computeStats(all)
    }

    const totalWeight = sources.reduce((acc, s) => acc + (weights[s] ?? 0), 0)
    const normWeights: Record<SafetyDataSource, number> =
        totalWeight > 0
            ? (Object.fromEntries(
                  sources.map((s) => [s, (weights[s] ?? 0) / totalWeight])
              ) as Record<SafetyDataSource, number>)
            : DEFAULT_SAFETY_WEIGHTS

    return samplesPerSegment.map(({ segmentIndex, samplesBySource }) => {
        const sourceScores: Partial<Record<SafetyDataSource, NormalizedSafetyScore>> = {}
        let weightedZSum = 0
        let appliedWeight = 0

        for (const source of sources) {
            const values = samplesBySource[source]
            const stats = statsBySource[source]
            if (!values || values.length === 0 || !stats) continue

            const meanValue = values.reduce((acc, v) => acc + v, 0) / values.length
            const score = normalize(meanValue, stats)
            sourceScores[source] = score
            weightedZSum += score.zScore * normWeights[source]
            appliedWeight += normWeights[source]
        }

        const compositeScore =
            appliedWeight > 0 ? zScoreToSafetyScore(weightedZSum / appliedWeight) : 50

        return { segmentIndex, sourceScores, compositeScore }
    })
}
