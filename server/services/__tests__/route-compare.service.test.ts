import { describe, it, expect } from 'vitest'
import {
    computeDistanceKm,
    computeAscentM,
    computeDescentM,
    estimateDurationMin,
    sampleCoords
} from '../route-compare.service'
import type { Position } from 'geojson'

describe('computeDistanceKm()', () => {
    it('좌표가 1개 이하면 0', () => {
        expect(computeDistanceKm([])).toBe(0)
        expect(computeDistanceKm([[126.97, 37.56]])).toBe(0)
    })

    it('동일 좌표 2개의 거리는 0', () => {
        const coords: Position[] = [
            [126.97, 37.56],
            [126.97, 37.56]
        ]
        expect(computeDistanceKm(coords)).toBeCloseTo(0, 5)
    })

    it('서울 → 부산 ≈ 325km (대원거리 근사)', () => {
        const coords: Position[] = [
            [126.97, 37.56],
            [129.07, 35.18]
        ]
        const km = computeDistanceKm(coords)
        expect(km).toBeGreaterThan(320)
        expect(km).toBeLessThan(330)
    })
})

describe('computeAscentM()', () => {
    it('빈 배열 또는 단일점은 0', () => {
        expect(computeAscentM([])).toBe(0)
        expect(computeAscentM([[0, 0, 100]])).toBe(0)
    })

    it('z 좌표가 없는 점들은 0', () => {
        const coords: Position[] = [
            [0, 0],
            [0, 0.01],
            [0, 0.02]
        ]
        expect(computeAscentM(coords)).toBe(0)
    })

    it('상승 차이만 합산', () => {
        // 0 → 10 → 5 → 15: 상승 = 10 + 10 = 20
        const coords: Position[] = [
            [0, 0, 0],
            [0, 0, 10],
            [0, 0, 5],
            [0, 0, 15]
        ]
        expect(computeAscentM(coords)).toBe(20)
    })

    it('내리막만 있으면 0', () => {
        const coords: Position[] = [
            [0, 0, 50],
            [0, 0, 30],
            [0, 0, 10]
        ]
        expect(computeAscentM(coords)).toBe(0)
    })
})

describe('computeDescentM()', () => {
    it('하강 차이만 양수로 합산', () => {
        // 100 → 80 → 90 → 50: 하강 = 20 + 40 = 60
        const coords: Position[] = [
            [0, 0, 100],
            [0, 0, 80],
            [0, 0, 90],
            [0, 0, 50]
        ]
        expect(computeDescentM(coords)).toBe(60)
    })

    it('오르막만 있으면 0', () => {
        const coords: Position[] = [
            [0, 0, 0],
            [0, 0, 10]
        ]
        expect(computeDescentM(coords)).toBe(0)
    })
})

describe('estimateDurationMin()', () => {
    it('기본 페이스 6:00/km — 5km → 30분', () => {
        expect(estimateDurationMin(5)).toBe(30)
    })

    it('사용자 페이스 5:30/km — 10km → 55분', () => {
        expect(estimateDurationMin(10, 5.5)).toBe(55)
    })

    it('0km 은 0분', () => {
        expect(estimateDurationMin(0)).toBe(0)
    })
})

describe('sampleCoords()', () => {
    it('stride <= 1 은 원본 그대로', () => {
        const coords: Position[] = [
            [0, 0],
            [1, 1],
            [2, 2]
        ]
        expect(sampleCoords(coords, 1)).toBe(coords)
        expect(sampleCoords(coords, 0)).toBe(coords)
    })

    it('빈 배열은 빈 배열', () => {
        expect(sampleCoords([], 5)).toEqual([])
    })

    it('stride 간격으로 샘플링하되 마지막 좌표를 포함', () => {
        const coords: Position[] = Array.from({ length: 11 }, (_, i) => [i, i] as Position)
        // stride 5 → 인덱스 0, 5, 10 + 마지막(10 — 이미 포함이므로 중복 X)
        const sampled = sampleCoords(coords, 5)
        expect(sampled).toEqual([
            [0, 0],
            [5, 5],
            [10, 10]
        ])
    })

    it('마지막 좌표가 stride 배수가 아니면 추가로 포함', () => {
        const coords: Position[] = Array.from({ length: 12 }, (_, i) => [i, i] as Position)
        // stride 5 → 인덱스 0, 5, 10 + 마지막(11)
        const sampled = sampleCoords(coords, 5)
        expect(sampled).toEqual([
            [0, 0],
            [5, 5],
            [10, 10],
            [11, 11]
        ])
    })
})
