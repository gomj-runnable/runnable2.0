/**
 * 안전 점수 산정 데이터 소스.
 * - accident: 교통사고 통계
 * - crime: 범죄 통계
 * - lighting: 조명/가로등 분포
 * - ugc: 사용자 제보 (피드백/리포트)
 */
export type SafetyDataSource = 'accident' | 'crime' | 'lighting' | 'ugc'

export interface SafetyStats {
    mean: number
    stdDev: number
    /** 통계 산출에 사용된 표본 개수. 0 이면 데이터 부재로 간주. */
    sampleSize: number
}

export interface NormalizedSafetyScore {
    /** 정규화된 z-score (-∞ ~ +∞). */
    zScore: number
    /** 0~100 안전 점수 (높을수록 안전). 데이터 부재 시 50. */
    safetyScore: number
}
