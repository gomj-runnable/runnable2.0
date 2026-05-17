/**
 * 러닝 일지 + 컨디션 트래커.
 * 매 달리기 후 RPE(자각 운동강도) + 컨디션 + 메모를 기록.
 * #149 참고.
 */

export type ConditionLevel = 'good' | 'normal' | 'bad'

export interface RunRecordBase {
    /** 연결된 경로 ID (선택) */
    routeId?: string
    /** 달린 날짜 (ISO date string) */
    runDate: string
    /** 거리 (km) */
    distanceKm: number
    /** 소요 시간 (초) */
    durationSec: number
    /** 평균 페이스 (초/km) */
    avgPaceSecPerKm: number
    /** RPE 1~10 (Borg CR-10) */
    rpe: number
    /** 컨디션 */
    condition: ConditionLevel
    /** 수면 시간 (선택) */
    sleepHours?: number
    /** 스트레스 1~5 (선택) */
    stressLevel?: number
    /** 통증 부위 (선택) */
    painAreas?: string[]
    /** 날씨 스냅샷 */
    weatherSnapshot?: {
        tempC: number
        humidity: number
        pm10?: number
    }
    /** 자유 메모 */
    notes?: string
}

export type RunRecordDraftInput = RunRecordBase

export interface SavedRunRecord extends RunRecordBase {
    recordId: string
    userId: string
    createdAt: string
}

export interface RunInsightWeekly {
    weekStart: string
    recordCount: number
    avgRpe: number
    deltaRpeVsLastWeek: number | null
    totalDistanceKm: number
    avgPaceSecPerKm: number
    conditionDistribution: Record<ConditionLevel, number>
    painFrequency: Record<string, number>
}
