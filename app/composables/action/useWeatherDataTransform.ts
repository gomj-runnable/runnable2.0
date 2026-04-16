import type {
    HourlyWeather,
    WeatherLayer
} from '#shared/types/weather'
import type { WeatherCondition, Pm10Grade } from '#shared/types/weather'
import { WeatherConditionEnum } from '#shared/types/weather-condition.enum'
import { Pm10GradeEnum } from '#shared/types/pm10-grade.enum'

/**
 * 기상청 강수형태(PTY)와 하늘상태(SKY) 코드를 앱 내부 날씨 상태로 변환한다.
 */
export const toWeatherCondition = (pty: number, sky: number): WeatherCondition =>
    WeatherConditionEnum.fromKmaCode(pty, sky).key as WeatherCondition

/**
 * PM10 미세먼지 수치를 등급으로 변환한다.
 */
export const toPm10Grade = (pm10: number): Pm10Grade =>
    Pm10GradeEnum.fromValue(pm10).key as Pm10Grade

/**
 * 날씨 상태를 지도 폴리곤 채우기 색상으로 변환한다.
 */
export const conditionToColor = (condition: WeatherCondition): string =>
    WeatherConditionEnum.from(condition).color

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
    return `rgba(${r}, ${g}, ${b}, 0.2)`
}

/**
 * PM10 미세먼지 등급을 지도 폴리곤 색상으로 변환한다.
 */
export const pm10GradeToColor = (grade: Pm10Grade): string =>
    Pm10GradeEnum.from(grade).color

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
 */
export const conditionToIcon = (condition: WeatherCondition): string =>
    WeatherConditionEnum.from(condition).icon

/**
 * 날씨 상태를 한국어 레이블 문자열로 변환한다.
 */
export const conditionLabel = (condition: WeatherCondition): string =>
    WeatherConditionEnum.from(condition).label
