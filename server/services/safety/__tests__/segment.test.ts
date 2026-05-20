import { describe, it, expect } from 'vitest'
import type { Position } from 'geojson'
import type {
    DEFAULT_SAFETY_WEIGHTS,
    splitRouteIntoSegments,
    computeSegmentSafetyScores,
    type SegmentSourceSamples
} from '../segment'

describe('splitRouteIntoSegments()', () => {
    it('좌표가 2개 미만이면 빈 배열', () => {
        expect(splitRouteIntoSegments([])).toEqual([])
        expect(splitRouteIntoSegments([[127.0, 37.5]])).toEqual([])
    })

    it('segmentLengthM 이 0 이하이면 빈 배열', () => {
        const coords: Position[] = [
            [127.0, 37.5],
            [127.001, 37.5]
        ]
        expect(splitRouteIntoSegments(coords, 0)).toEqual([])
        expect(splitRouteIntoSegments(coords, -10)).toEqual([])
    })

    it('짧은 경로는 1개 세그먼트로 묶이고 endKm 가 누적 거리와 일치', () => {
        const coords: Position[] = [
            [127.0, 37.5],
            [127.0005, 37.5]
        ]
        const segs = splitRouteIntoSegments(coords, 1000)
        expect(segs).toHaveLength(1)
        expect(segs[0]?.startKm).toBe(0)
        expect(segs[0]?.endKm).toBeGreaterThan(0)
        expect(segs[0]?.coords).toHaveLength(2)
    })

    it('100m 간격 분할 시 인덱스가 0 부터 증가하고 누적 거리가 단조 증가', () => {
        const coords: Position[] = Array.from({ length: 11 }, (_, i) => [127.0 + i * 0.001, 37.5])
        const segs = splitRouteIntoSegments(coords, 100)
        expect(segs.length).toBeGreaterThan(1)
        segs.forEach((s, i) => {
            expect(s.index).toBe(i)
            if (i > 0) expect(s.startKm).toBeGreaterThanOrEqual(segs[i - 1]!.endKm - 1e-9)
        })
    })
})

describe('computeSegmentSafetyScores()', () => {
    it('데이터가 전혀 없으면 모든 세그먼트가 50 점', () => {
        const samples: SegmentSourceSamples[] = [
            { segmentIndex: 0, samplesBySource: {} },
            { segmentIndex: 1, samplesBySource: {} }
        ]
        const results = computeSegmentSafetyScores(samples)
        expect(results).toHaveLength(2)
        results.forEach((r) => expect(r.compositeScore).toBe(50))
    })

    it('단일 소스만 있어도 다른 세그먼트와 상대 비교해 위험 ↑ → 점수 ↓', () => {
        const samples: SegmentSourceSamples[] = [
            { segmentIndex: 0, samplesBySource: { accident: [1] } },
            { segmentIndex: 1, samplesBySource: { accident: [5] } },
            { segmentIndex: 2, samplesBySource: { accident: [10] } }
        ]
        const results = computeSegmentSafetyScores(samples)
        expect(results[0]!.compositeScore).toBeGreaterThan(results[2]!.compositeScore)
    })

    it('소스별 점수가 정규화되어 sourceScores 에 채워짐', () => {
        const samples: SegmentSourceSamples[] = [
            {
                segmentIndex: 0,
                samplesBySource: { accident: [1, 2], crime: [3] }
            },
            {
                segmentIndex: 1,
                samplesBySource: { accident: [5], crime: [10] }
            }
        ]
        const results = computeSegmentSafetyScores(samples)
        expect(results[0]!.sourceScores.accident).toBeDefined()
        expect(results[0]!.sourceScores.crime).toBeDefined()
        expect(results[0]!.sourceScores.lighting).toBeUndefined()
    })

    it('가중치 합이 0 이면 균등 가중치로 폴백', () => {
        const zero: Record<keyof typeof DEFAULT_SAFETY_WEIGHTS, number> = {
            accident: 0,
            crime: 0,
            lighting: 0,
            ugc: 0
        }
        const samples: SegmentSourceSamples[] = [
            { segmentIndex: 0, samplesBySource: { accident: [1] } },
            { segmentIndex: 1, samplesBySource: { accident: [10] } }
        ]
        const results = computeSegmentSafetyScores(samples, zero)
        expect(results[0]!.compositeScore).not.toBe(results[1]!.compositeScore)
    })
})
