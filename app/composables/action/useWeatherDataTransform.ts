import type {
    WeatherCondition,
    HourlyWeather,
    Pm10Grade,
    WeatherLayer
} from '#shared/types/weather'

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
    // -10 ~ 40°C 범위를 blue -> cyan -> yellow -> red 그라데이션으로 매핑
    const clamped = Math.max(-10, Math.min(40, tempAvg))
    type TempColorStop = { t: number; rgb: [number, number, number] }
    const stops = [
        { t: -10, rgb: [48, 118, 255] },
        { t: 0, rgb: [57, 196, 255] },
        { t: 15, rgb: [122, 214, 102] },
        { t: 25, rgb: [247, 203, 69] },
        { t: 40, rgb: [230, 90, 58] }
    ] satisfies TempColorStop[]

    let left: TempColorStop = stops[0] ?? { t: -10, rgb: [48, 118, 255] }
    let right: TempColorStop = stops[stops.length - 1] ?? { t: 40, rgb: [230, 90, 58] }
    for (let index = 0; index < stops.length - 1; index += 1) {
        const current = stops[index]
        const next = stops[index + 1]
        if (!current || !next) {
            continue
        }
        if (clamped >= current.t && clamped <= next.t) {
            left = current
            right = next
            break
        }
    }

    const span = Math.max(right.t - left.t, 1)
    const ratio = (clamped - left.t) / span
    const r = Math.round(left.rgb[0] + (right.rgb[0] - left.rgb[0]) * ratio)
    const g = Math.round(left.rgb[1] + (right.rgb[1] - left.rgb[1]) * ratio)
    const b = Math.round(left.rgb[2] + (right.rgb[2] - left.rgb[2]) * ratio)
    return `rgba(${r}, ${g}, ${b}, 0.5)`
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

const PM10_NO_DATA_COLOR = 'rgba(80, 80, 80, 0.3)'

export const resolvePolygonColor = (weather: HourlyWeather, layer: WeatherLayer): string => {
    switch (layer) {
        case 'weather':
            return conditionToColor(weather.condition)
        case 'temperature':
            return tempToColor(weather.temperature)
        case 'pm10':
            return weather.pm10Grade ? pm10GradeToColor(weather.pm10Grade) : PM10_NO_DATA_COLOR
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
