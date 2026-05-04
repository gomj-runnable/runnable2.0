import type { WeatherSourceKey, HourlyWeather } from '#shared/types/weather'
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { filterSlotsBySource, filterAvailableDatesBySource } from '../lib/useWeatherFilter'

/** 레이어 → 소스 매핑: 각 레이어가 암묵적으로 사용하는 데이터 소스 */
const LAYER_SOURCE_MAP: Record<string, WeatherSourceKey> = {
    weather: 'forecast',
    temperature: 'observed',
    pm10: 'airquality'
}

/**
 * 데이터 소스 필터 전략을 관리하는 store composable.
 * 레이어 선택 시 소스가 자동으로 연결된다.
 */
export const useWeatherSourceStrategy = () => {
    /** 현재 필터링 중인 소스. null이면 전체 표시. */
    const activeSourceFilter = useState<WeatherSourceKey | null>(
        'weather.activeSourceFilter',
        () => null
    )

    /** sourceAvailability 원본 (availability API에서 받은 값) */
    const sourceAvailability = useState<Record<string, string[]>>(
        'weather.sourceAvailability',
        () => ({})
    )

    /** 레이어 변경 시 소스를 자동 동기화한다. */
    const syncSourceFromLayer = (layer: WeatherLayerEnum | null) => {
        activeSourceFilter.value = layer ? (LAYER_SOURCE_MAP[layer.key] ?? null) : null
    }

    /** 활성 소스 기반 필터된 가용 날짜 */
    const filteredAvailableDates = computed<Set<string>>(() => {
        return filterAvailableDatesBySource(sourceAvailability.value, activeSourceFilter.value)
    })

    /** HourlyWeather 배열을 활성 소스로 필터링한다. */
    const filterSlots = (slots: HourlyWeather[]): HourlyWeather[] => {
        return filterSlotsBySource(slots, activeSourceFilter.value)
    }

    return {
        activeSourceFilter,
        sourceAvailability,
        syncSourceFromLayer,
        filteredAvailableDates,
        filterSlots
    }
}
