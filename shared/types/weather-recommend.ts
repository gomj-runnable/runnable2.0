/** 날씨 적합도 계산에 사용하는 기상 수치 조건 */
export interface WeatherMetrics {
    temperature: number
    precipitation: number
    windSpeed: number
    humidity: number
}

/** 경로 속성 — 거리(m)·최고 고도·최저 고도 */
export interface RouteAttributes {
    distance?: number
    highHeight?: number
    lowHeight?: number
}

/** 날씨-경로 적합도 점수와 추천 태그 */
export interface SuitabilityResult {
    /** 적합도 점수 (0–100) */
    score: number
    /** 추천 이유 태그 목록 (예: '#달리기좋은날') */
    tags: string[]
}

/** 날씨 기반 추천 경로 항목 */
export interface RecommendedRoute {
    routeId: string
    title: string
    distance?: number
    highHeight?: number
    lowHeight?: number
    score: number
    tags: string[]
}
