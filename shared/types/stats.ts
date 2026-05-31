// 경로 통계 집계 타입 (월별·전체 요약)
/** 월별 경로 통계 집계 */
export interface MonthlyRouteStat {
    /** YYYY-MM 형식 */
    month: string
    count: number
    totalDistanceKm: number
}

/** 사용자 전체 경로 통계 요약 */
export interface RouteStats {
    routeCount: number
    totalDistanceKm: number
    /** highHeight - lowHeight 합산 (고도차 근사값) */
    totalElevationChangeM: number
    monthlyStats: MonthlyRouteStat[]
}
