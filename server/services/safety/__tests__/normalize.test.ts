import { describe, it, expect } from 'vitest'
import { zScore, erf, normalCdf, zScoreToSafetyScore, normalize, computeStats } from '../normalize'

describe('zScore()', () => {
    it('평균과 같은 값은 z=0', () => {
        expect(zScore(10, 10, 2)).toBe(0)
    })

    it('+1σ 위치는 z=1', () => {
        expect(zScore(12, 10, 2)).toBe(1)
    })

    it('-1σ 위치는 z=-1', () => {
        expect(zScore(8, 10, 2)).toBe(-1)
    })

    it('stdDev=0 이면 0 반환', () => {
        expect(zScore(10, 5, 0)).toBe(0)
    })

    it('NaN/Infinity 입력은 0 반환', () => {
        expect(zScore(NaN, 0, 1)).toBe(0)
        expect(zScore(0, NaN, 1)).toBe(0)
        expect(zScore(0, 0, Infinity)).toBe(0)
    })
})

describe('erf()', () => {
    it('erf(0) ≈ 0', () => {
        expect(erf(0)).toBeCloseTo(0, 6)
    })

    it('홀수 함수: erf(-x) = -erf(x)', () => {
        expect(erf(-0.5)).toBeCloseTo(-erf(0.5), 6)
        expect(erf(-1.5)).toBeCloseTo(-erf(1.5), 6)
    })

    it('알려진 값 근사 (오차 < 1e-5)', () => {
        // erf(1) ≈ 0.8427007929
        expect(erf(1)).toBeCloseTo(0.8427, 4)
        // erf(2) ≈ 0.9953222650
        expect(erf(2)).toBeCloseTo(0.9953, 4)
    })

    it('극단값 수렴: erf(±∞) → ±1', () => {
        expect(erf(Infinity)).toBe(1)
        expect(erf(-Infinity)).toBe(-1)
    })
})

describe('normalCdf()', () => {
    it('Φ(0) = 0.5', () => {
        expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    })

    it('Φ(1) ≈ 0.8413', () => {
        expect(normalCdf(1)).toBeCloseTo(0.8413, 3)
    })

    it('Φ(-1) ≈ 0.1587', () => {
        expect(normalCdf(-1)).toBeCloseTo(0.1587, 3)
    })
})

describe('zScoreToSafetyScore()', () => {
    it('z=0 → 50 (평균 위험도)', () => {
        expect(zScoreToSafetyScore(0)).toBe(50)
    })

    it('z=+1 → 약 16 (위험 ↑ → 점수 ↓)', () => {
        expect(zScoreToSafetyScore(1)).toBeGreaterThanOrEqual(15)
        expect(zScoreToSafetyScore(1)).toBeLessThanOrEqual(17)
    })

    it('z=-1 → 약 84 (안전 ↑ → 점수 ↑)', () => {
        expect(zScoreToSafetyScore(-1)).toBeGreaterThanOrEqual(83)
        expect(zScoreToSafetyScore(-1)).toBeLessThanOrEqual(85)
    })

    it('극단값 안전: z=+10 → 0 근처, z=-10 → 100 근처', () => {
        expect(zScoreToSafetyScore(10)).toBe(0)
        expect(zScoreToSafetyScore(-10)).toBe(100)
    })

    it('NaN 입력은 중립 50', () => {
        expect(zScoreToSafetyScore(NaN)).toBe(50)
    })
})

describe('normalize()', () => {
    it('정상 케이스: 평균값은 z=0, score=50', () => {
        const result = normalize(10, { mean: 10, stdDev: 2, sampleSize: 100 })
        expect(result.zScore).toBe(0)
        expect(result.safetyScore).toBe(50)
    })

    it('sampleSize=0 이면 데이터 부재 → 중립 50', () => {
        const result = normalize(10, { mean: 0, stdDev: 0, sampleSize: 0 })
        expect(result.safetyScore).toBe(50)
        expect(result.zScore).toBe(0)
    })

    it('stdDev=0 이면 중립 50', () => {
        const result = normalize(10, { mean: 5, stdDev: 0, sampleSize: 50 })
        expect(result.safetyScore).toBe(50)
    })

    it('NaN value 는 중립 50', () => {
        const result = normalize(NaN, { mean: 10, stdDev: 2, sampleSize: 50 })
        expect(result.safetyScore).toBe(50)
    })
})

describe('computeStats()', () => {
    it('빈 배열은 sampleSize=0', () => {
        expect(computeStats([])).toEqual({ mean: 0, stdDev: 0, sampleSize: 0 })
    })

    it('단일 값의 stdDev 는 0', () => {
        const stats = computeStats([5])
        expect(stats.mean).toBe(5)
        expect(stats.stdDev).toBe(0)
        expect(stats.sampleSize).toBe(1)
    })

    it('[1,2,3,4,5] 의 평균=3, 모집단 표준편차 ≈ 1.4142', () => {
        const stats = computeStats([1, 2, 3, 4, 5])
        expect(stats.mean).toBe(3)
        expect(stats.stdDev).toBeCloseTo(Math.sqrt(2), 4)
        expect(stats.sampleSize).toBe(5)
    })

    it('NaN 은 표본에서 제외', () => {
        const stats = computeStats([1, 2, NaN, 3])
        expect(stats.sampleSize).toBe(3)
        expect(stats.mean).toBe(2)
    })
})
