import type { WeatherCondition, DailyWeather, Pm10Grade, WeatherLayer } from '#shared/types/weather'

export const toWeatherCondition = (pty: number, sky: number): WeatherCondition => {
    if (pty === 1 || pty === 4) return 'rainy'
    if (pty === 2 || pty === 3) return 'snowy'
    if (sky === 1) return 'clear'
    if (sky === 3) return 'partly-cloudy'
    return 'cloudy'
}

export const toPm10Grade = (pm10: number): Pm10Grade => {
    if (pm10 <= 30) return 'good'
    if (pm10 <= 80) return 'moderate'
    if (pm10 <= 150) return 'bad'
    return 'very-bad'
}

export const conditionToColor = (condition: WeatherCondition): string => {
    switch (condition) {
        case 'clear':
            return 'rgba(255, 230, 50, 0.5)'
        case 'partly-cloudy':
            return 'rgba(180, 200, 220, 0.5)'
        case 'cloudy':
            return 'rgba(140, 155, 170, 0.5)'
        case 'rainy':
            return 'rgba(60, 150, 220, 0.5)'
        case 'snowy':
            return 'rgba(200, 230, 255, 0.5)'
    }
}

export const tempToColor = (tempAvg: number): string => {
    // -10 ~ 40°C 범위를 파란색 → 빨간색으로 매핑
    const normalized = Math.max(0, Math.min(1, (tempAvg + 10) / 50))
    const r = Math.round(normalized * 230 + 20)
    const b = Math.round((1 - normalized) * 230 + 20)
    return `rgba(${r}, 80, ${b}, 0.5)`
}

export const pm10GradeToColor = (grade: Pm10Grade): string => {
    switch (grade) {
        case 'good':
            return 'rgba(100, 200, 100, 0.5)'
        case 'moderate':
            return 'rgba(250, 220, 50, 0.5)'
        case 'bad':
            return 'rgba(255, 150, 50, 0.5)'
        case 'very-bad':
            return 'rgba(220, 60, 60, 0.5)'
    }
}

export const toOpaqueColor = (color: string): string =>
    color.replace(
        /rgba\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*[^)]+\)/i,
        'rgba($1, $2, $3, 1)'
    )

export const resolvePolygonColor = (weather: DailyWeather, layer: WeatherLayer): string => {
    switch (layer) {
        case 'weather':
            return conditionToColor(weather.condition)
        case 'temperature':
            return tempToColor((weather.tempMin + weather.tempMax) / 2)
        case 'pm10':
            return pm10GradeToColor(weather.pm10Grade)
    }
}

export const conditionToIcon = (condition: WeatherCondition): string => {
    switch (condition) {
        case 'clear':
            return 'i-lucide-sun'
        case 'partly-cloudy':
            return 'i-lucide-cloud-sun'
        case 'cloudy':
            return 'i-lucide-cloud'
        case 'rainy':
            return 'i-lucide-cloud-rain'
        case 'snowy':
            return 'i-lucide-snowflake'
    }
}

export const conditionLabel = (condition: WeatherCondition): string => {
    switch (condition) {
        case 'clear':
            return '맑음'
        case 'partly-cloudy':
            return '구름많음'
        case 'cloudy':
            return '흐림'
        case 'rainy':
            return '비'
        case 'snowy':
            return '눈'
    }
}
