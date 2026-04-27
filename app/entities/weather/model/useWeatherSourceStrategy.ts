import type { WeatherSourceKey, HourlyWeather } from '#shared/types/weather'
import { filterSlotsBySource, filterAvailableDatesBySource } from '../lib/useWeatherFilter'

export interface SourceToggleItem {
    key: WeatherSourceKey
    label: string
    icon: string
}

export const WEATHER_SOURCES: SourceToggleItem[] = [
    { key: 'observed', label: '관측', icon: 'i-lucide-eye' },
    { key: 'forecast', label: '예보', icon: 'i-lucide-cloud-sun' },
    { key: 'airquality', label: '대기질', icon: 'i-lucide-wind' }
]

/**
 * 데이터 소스 필터 전략을 관리하는 store composable.
 * null = 전체 소스 표시, 값 = 해당 소스만 필터 (기존 레이어 토글과 동일 패턴).
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

    /** 소스 토글: 활성 → null(전체), 비활성 → 선택(단일) */
    const toggleSource = (source: WeatherSourceKey) => {
        activeSourceFilter.value = activeSourceFilter.value === source ? null : source
    }

    /** 소스가 활성 상태인지 확인한다. */
    const isSourceActive = (source: WeatherSourceKey): boolean => {
        return activeSourceFilter.value === source
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
        toggleSource,
        isSourceActive,
        filteredAvailableDates,
        filterSlots
    }
}
