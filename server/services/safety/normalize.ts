/**
 * 안전 점수 Z-score 정규화 엔진 (Issue #195).
 *
 * 데이터 소스별 측정값을 Z-score 로 정규화한 뒤,
 * 표준 정규분포 CDF 를 통해 0~100 안전 점수로 매핑한다.
 *
 * 위험 측정값이 클수록(z ↑) 안전 점수는 낮아진다.
 *   z =  0 → safetyScore 50  (평균 위험도)
 *   z = +1 → safetyScore ~16 (평균 + 1σ, 위험 ↑)
 *   z = -1 → safetyScore ~84 (평균 - 1σ, 안전 ↑)
 *
 * 데이터 부재 (stdDev = 0 또는 sampleSize = 0) 시 중립 점수 50 반환.
 */

import type { NormalizedSafetyScore, SafetyStats } from './types'

/**
 * 표준 z-score 계산.
 *   z = (value - mean) / stdDev
 *
 * stdDev 가 0 이면 분산이 없는 상태이므로 0(평균과 동일) 반환.
 */
export function zScore(value: number, mean: number, stdDev: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(mean) || !Number.isFinite(stdDev)) return 0
    if (stdDev === 0) return 0
    return (value - mean) / stdDev
}

/**
 * 오차 함수 근사 (Abramowitz & Stegun 7.1.26).
 * 최대 오차 ≈ 1.5e-7. 표준 정규 CDF 계산에 사용.
 */
export function erf(x: number): number {
    if (!Number.isFinite(x)) return x > 0 ? 1 : -1

    const sign = x < 0 ? -1 : 1
    const ax = Math.abs(x)

    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const t = 1 / (1 + p * ax)
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax)
    return sign * y
}

/**
 * 표준 정규분포의 누적분포함수 Φ(z).
 */
export function normalCdf(z: number): number {
    return 0.5 * (1 + erf(z / Math.SQRT2))
}

/**
 * Z-score → 0~100 안전 점수.
 * 위험도(z) 가 높을수록 점수는 낮아진다.
 *
 *   safetyScore = round((1 - Φ(z)) * 100)
 */
export function zScoreToSafetyScore(z: number): number {
    if (!Number.isFinite(z)) return 50
    const cdf = normalCdf(z)
    return Math.round((1 - cdf) * 100)
}

/**
 * 단일 측정값을 통계로 정규화한다.
 *
 * 데이터 부재(stats.sampleSize = 0 또는 stdDev = 0) 시 중립 점수 50 반환.
 */
export function normalize(value: number, stats: SafetyStats): NormalizedSafetyScore {
    if (
        stats.sampleSize === 0 ||
        stats.stdDev === 0 ||
        !Number.isFinite(value) ||
        !Number.isFinite(stats.mean) ||
        !Number.isFinite(stats.stdDev)
    ) {
        return { zScore: 0, safetyScore: 50 }
    }

    const z = zScore(value, stats.mean, stats.stdDev)
    return { zScore: z, safetyScore: zScoreToSafetyScore(z) }
}

/**
 * 표본 배열에서 평균·표준편차(모집단 표준편차)·표본 수를 계산한다.
 * 빈 배열이면 데이터 부재 (sampleSize = 0).
 */
export function computeStats(samples: number[]): SafetyStats {
    const valid = samples.filter((v) => Number.isFinite(v))
    const n = valid.length
    if (n === 0) return { mean: 0, stdDev: 0, sampleSize: 0 }

    const mean = valid.reduce((sum, v) => sum + v, 0) / n
    const variance = valid.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n
    return { mean, stdDev: Math.sqrt(variance), sampleSize: n }
}
