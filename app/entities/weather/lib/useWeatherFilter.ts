import type { HourlyWeather, WeatherSourceKey } from '#shared/types/weather'

/**
 * 단일 소스 필터 기반으로 HourlyWeather 슬롯을 필터링한다.
 * - null: 전체 표시 (필터 없음)
 * - observed/forecast: source 필드로 필터
 * - airquality: pm10이 있는 슬롯만 표시
 */
export const filterSlotsBySource = (
    slots: HourlyWeather[],
    activeSource: WeatherSourceKey | null
): HourlyWeather[] => {
    if (activeSource === null) return slots

    if (activeSource === 'airquality') {
        return slots.filter((slot) => slot.pm10 !== null)
    }

    return slots.filter((slot) => slot.source === activeSource)
}

/**
 * sourceAvailability 맵에서 선택된 소스에 해당하는 날짜만 반환한다.
 * null이면 전체 소스의 합집합.
 */
export const filterAvailableDatesBySource = (
    sourceAvailability: Record<string, string[]>,
    activeSource: WeatherSourceKey | null
): Set<string> => {
    if (activeSource !== null) {
        return new Set(sourceAvailability[activeSource] ?? [])
    }

    const dates = new Set<string>()
    for (const sourceDates of Object.values(sourceAvailability)) {
        for (const date of sourceDates) {
            dates.add(date)
        }
    }
    return dates
}
