import type { WeatherMetrics, RouteAttributes, SuitabilityResult } from '#shared/types/weather-recommend'

/**
 * 날씨 조건과 경로 속성을 조합해 러닝 적합도 점수와 추천 태그를 계산하는 순수 함수 action.
 * 외부 API·전역 상태·브라우저 IO에 의존하지 않는다.
 */
export const useWeatherRouteMatchAction = () => {
    /**
     * 기온 조건 점수를 계산한다.
     * 15–25°C 구간을 이상적으로 보고 범위를 벗어날수록 감점한다.
     */
    const scoreTemperate = (temperature: number): number => {
        if (temperature >= 15 && temperature <= 25) return 100
        if (temperature >= 10 && temperature < 15) return 80
        if (temperature > 25 && temperature <= 30) return 75
        if (temperature >= 5 && temperature < 10) return 55
        if (temperature > 30 && temperature <= 35) return 40
        if (temperature >= 0 && temperature < 5) return 30
        if (temperature > 35) return 15
        // 영하
        return 10
    }

    /**
     * 강수량 조건 점수를 계산한다.
     * 강수 없음이 최적, 강수량이 많을수록 감점한다.
     */
    const scorePrecipitation = (precipitation: number): number => {
        if (precipitation <= 0) return 100
        if (precipitation < 1) return 60
        if (precipitation < 5) return 30
        return 5
    }

    /**
     * 풍속 조건 점수를 계산한다.
     * 5m/s 미만이 쾌적, 강풍일수록 감점한다.
     */
    const scoreWindSpeed = (windSpeed: number): number => {
        if (windSpeed < 5) return 100
        if (windSpeed < 10) return 70
        if (windSpeed < 15) return 40
        return 15
    }

    /**
     * 고도차 보정값을 반환한다.
     * 날씨가 열악할수록 낮은 고도 경로를 선호하도록 조정한다.
     */
    const elevationBonus = (
        weather: WeatherMetrics,
        route: RouteAttributes
    ): number => {
        const elevDiff = (route.highHeight ?? 0) - (route.lowHeight ?? 0)
        const isHot = weather.temperature > 30
        const isRainy = weather.precipitation > 0
        const isCold = weather.temperature < 0
        const isPerfect =
            weather.temperature >= 15 &&
            weather.temperature <= 25 &&
            weather.precipitation <= 0 &&
            weather.windSpeed < 5

        // 완벽한 날씨에는 고도 경치 경로에 보너스
        if (isPerfect && elevDiff > 100) return 5
        // 더운 날·비·추운 날에는 고도 낮은 경로 선호
        if ((isHot || isRainy || isCold) && elevDiff > 200) return -10
        if ((isHot || isRainy || isCold) && elevDiff <= 50) return 5
        return 0
    }

    /**
     * 거리 보정값을 반환한다.
     * 날씨가 열악할수록 짧은 경로를 선호한다.
     */
    const distanceBonus = (
        weather: WeatherMetrics,
        route: RouteAttributes
    ): number => {
        const distKm = (route.distance ?? 5000) / 1000
        const isHot = weather.temperature > 30
        const isRainy = weather.precipitation > 0
        const isCold = weather.temperature < 0

        if ((isHot || isRainy || isCold) && distKm <= 5) return 8
        if ((isHot || isRainy || isCold) && distKm > 10) return -8
        return 0
    }

    /**
     * 날씨 조건과 경로 속성을 기반으로 적합도 점수와 추천 태그를 계산한다.
     *
     * @param weather - 현재 기상 조건
     * @param route - 경로 속성 (거리·고도)
     * @returns 적합도 점수(0–100)와 태그 배열
     */
    const calculateSuitability = (
        weather: WeatherMetrics,
        route: RouteAttributes
    ): SuitabilityResult => {
        const tempScore = scoreTemperate(weather.temperature)
        const rainScore = scorePrecipitation(weather.precipitation)
        const windScore = scoreWindSpeed(weather.windSpeed)

        // 가중 평균: 기온 40%, 강수 35%, 풍속 25%
        const baseScore = tempScore * 0.4 + rainScore * 0.35 + windScore * 0.25

        const bonus = elevationBonus(weather, route) + distanceBonus(weather, route)
        const score = Math.max(0, Math.min(100, Math.round(baseScore + bonus)))

        const tags = generateTags(weather, route)
        return { score, tags }
    }

    /**
     * 날씨·경로 조합에 맞는 추천 이유 태그를 생성한다.
     *
     * @param weather - 현재 기상 조건
     * @param route - 경로 속성
     * @returns 태그 문자열 배열
     */
    const generateTags = (
        weather: WeatherMetrics,
        route: RouteAttributes
    ): string[] => {
        const tags: string[] = []
        const elevDiff = (route.highHeight ?? 0) - (route.lowHeight ?? 0)
        const distKm = (route.distance ?? 5000) / 1000

        const isPerfect =
            weather.temperature >= 15 &&
            weather.temperature <= 25 &&
            weather.precipitation <= 0 &&
            weather.windSpeed < 5

        if (isPerfect) {
            tags.push('#달리기좋은날')
            if (elevDiff > 100) tags.push('#전망맛집')
        }

        if (weather.precipitation > 0 && distKm <= 5) {
            tags.push('#비올때도OK')
        }

        if (weather.windSpeed >= 10) {
            tags.push('#바람주의')
        }

        if (weather.temperature > 30) {
            tags.push('#더위주의')
            if (distKm <= 5) tags.push('#단거리추천')
        }

        if (weather.temperature < 0) {
            tags.push('#추위주의')
            if (distKm <= 5) tags.push('#단거리추천')
        }

        if (elevDiff > 200 && isPerfect) {
            if (!tags.includes('#전망맛집')) tags.push('#전망맛집')
        }

        return tags
    }

    return { calculateSuitability, generateTags }
}
