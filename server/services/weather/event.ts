import type { H3Event } from 'h3'
import type { WeatherSourceKey } from '#shared/types/weather'

const VALID_SOURCES: WeatherSourceKey[] = ['observed', 'forecast', 'airquality']

/** 쉼표 구분 문자열에서 유효한 WeatherSourceKey만 추출한다. */
export const parseSources = (raw?: string): WeatherSourceKey[] => {
    if (!raw) return [...VALID_SOURCES]
    return raw
        .split(',')
        .map((s) => s.trim() as WeatherSourceKey)
        .filter((s) => VALID_SOURCES.includes(s))
}

export interface WeatherConfigKeys {
    authKey: string
    openDataKey: string
    airKoreaKey: string
}

/** RuntimeConfig에서 weather 외부 API 키 3종을 추출한다. */
export const resolveWeatherKeys = (event: H3Event): WeatherConfigKeys => {
    const config = useRuntimeConfig(event)
    return {
        authKey: String(config.weatherKor ?? '').trim(),
        openDataKey: String(config.openData ?? '').trim(),
        airKoreaKey: String(config.airKoreaKey ?? '').trim()
    }
}
