import type {
    WeatherCondition,
    HourlyWeather,
    Pm10Grade,
    WeatherLayer
} from '#shared/types/weather'

/**
 * 기상청 강수형태(PTY)와 하늘상태(SKY) 코드를 앱 내부 날씨 상태로 변환한다.
 *
 * @param pty - 강수형태 코드 (0: 없음, 1·4: 비, 2·3: 눈)
 * @param sky - 하늘상태 코드 (1: 맑음, 3: 구름많음, 4: 흐림)
 * @returns 앱에서 사용하는 `WeatherCondition` 문자열
 */
export const toWeatherCondition = (pty: number, sky: number): WeatherCondition => {
    if (pty === 1 || pty === 4) return 'rainy'
    if (pty === 2 || pty === 3) return 'snowy'
    if (sky === 1) return 'clear'
    if (sky === 3) return 'partly-cloudy'
    return 'cloudy'
}

/**
 * PM10 미세먼지 수치를 등급으로 변환한다.
 *
 * @param pm10 - PM10 농도 (µg/m³)
 * @returns `'good'` | `'moderate'` | `'bad'` | `'very-bad'`
 */
export const toPm10Grade = (pm10: number): Pm10Grade => {
    if (pm10 <= 30) return 'good'
    if (pm10 <= 80) return 'moderate'
    if (pm10 <= 150) return 'bad'
    return 'very-bad'
}

/**
 * 날씨 상태를 지도 폴리곤 채우기 색상으로 변환한다.
 *
 * @param condition - 앱 내부 날씨 상태 값
 * @returns 반투명 RGBA 색상 문자열
 */
export const conditionToColor = (condition: WeatherCondition): string => {
    switch (condition) {
        case 'clear':
            return 'rgba(255, 230, 50, 0.5)'
        case 'partly-cloudy':
            return 'rgba(200, 185, 155, 0.5)'
        case 'cloudy':
            return 'rgba(120, 120, 160, 0.5)'
        case 'rainy':
            return 'rgba(60, 150, 220, 0.5)'
        case 'snowy':
            return 'rgba(150, 210, 250, 0.6)'
    }
}

/**
 * 평균 기온을 온도 단계별 그라데이션 색상으로 변환한다.
 * -10°C(파랑)에서 40°C(빨강)까지 색상 정지점을 선형 보간한다.
 *
 * @param tempAvg - 평균 기온 (°C). -10~40 범위 외에는 경계값으로 클램프된다.
 * @returns 반투명 RGBA 색상 문자열
 */
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

/**
 * PM10 미세먼지 등급을 지도 폴리곤 색상으로 변환한다.
 *
 * @param grade - PM10 등급 (`'good'` | `'moderate'` | `'bad'` | `'very-bad'`)
 * @returns 반투명 RGBA 색상 문자열
 */
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

/**
 * 반투명 RGBA 색상 문자열을 완전 불투명(알파=1)으로 변환한다.
 * 외곽선 프리미티브처럼 투명도 없이 선명하게 표시해야 할 때 사용한다.
 *
 * @param color - 반투명 RGBA 색상 문자열
 * @returns 알파가 1로 고정된 RGBA 색상 문자열
 */
export const toOpaqueColor = (color: string): string =>
    color.replace(
        /rgba\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*[^)]+\)/i,
        'rgba($1, $2, $3, 1)'
    )

const PM10_NO_DATA_COLOR = 'rgba(80, 80, 80, 0.3)'

/**
 * 시간별 날씨 데이터와 활성 레이어에 따라 지도 폴리곤 색상을 결정한다.
 *
 * @param weather - 해당 동의 시간별 날씨 데이터
 * @param layer - 현재 활성 날씨 레이어 (`'weather'` | `'temperature'` | `'pm10'`)
 * @returns 레이어에 맞는 반투명 RGBA 색상 문자열
 */
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

/**
 * 날씨 상태를 Iconify 아이콘 클래스명으로 변환한다.
 *
 * @param condition - 앱 내부 날씨 상태 값
 * @returns `i-lucide-*` 형식의 아이콘 클래스 문자열
 */
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

/**
 * 날씨 상태를 한국어 레이블 문자열로 변환한다.
 *
 * @param condition - 앱 내부 날씨 상태 값
 * @returns 날씨 상태 한국어 레이블 (예: `'맑음'`, `'비'`)
 */
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
