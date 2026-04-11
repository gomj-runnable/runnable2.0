import type { SeoulMonthlyWeather, HourlyWeather, WeatherLayer } from '#shared/types/weather'

type ActiveWeatherLayer = WeatherLayer | null

/**
 * 날씨 패널의 날짜·시간·레이어 선택 상태와 날씨 데이터를 관리하는 store composable.
 * `dailySnapshot`은 선택된 날짜+시간의 동별 날씨 데이터를 computed로 제공한다.
 */
export const useWeatherStore = () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const thisHour = `${String(today.getHours()).padStart(2, '0')}:00`
    const toMonth = (date: string): string => date.slice(0, 7).replace('-', '')

    /** 날씨 패널에서 선택된 날짜 (YYYY-MM-DD 형식) */
    const selectedDate = useState<string>('weather.selectedDate', () => todayStr)
    /** 날씨 패널에서 선택된 시간 (HH:00 형식) */
    const selectedHour = useState<string>('weather.selectedHour', () => thisHour)
    /** 선택된 날짜에서 추출된 년월 (YYYYMM 형식) */
    const selectedMonth = useState<string>('weather.selectedMonth', () => toMonth(todayStr))
    /** 서버에서 불러온 월별 날씨 데이터. 미로드 상태이면 `null`. */
    const monthlyData = useState<SeoulMonthlyWeather | null>('weather.monthlyData', () => null)
    /** 서울 행정경계 GeoJSON 데이터. 미로드 상태이면 `null`. */
    const boundaryGeojson = useState<unknown>('weather.boundaryGeojson', () => null)
    /** 날씨 데이터 로딩 중 여부 */
    const isLoading = useState<boolean>('weather.isLoading', () => false)
    /** 현재 활성 날씨 레이어 (`'weather'` | `'temperature'` | `'pm10'` | `null`) */
    const activeLayer = useState<ActiveWeatherLayer>('weather.activeLayer', () => 'weather')
    /** 날씨 레이어 지도 표시 여부 */
    const isVisible = useState<boolean>('weather.isVisible', () => true)

    /** 선택된 날짜+시간의 동별 날씨 스냅샷 (dongCode → HourlyWeather) */
    const dailySnapshot = computed<Map<string, HourlyWeather>>(() => {
        const map = new Map<string, HourlyWeather>()
        if (!monthlyData.value) return map

        for (const dong of monthlyData.value.dongs) {
            const daily = dong.hourly.find(
                (d) => d.date === selectedDate.value && d.time === selectedHour.value
            )
            if (daily) map.set(dong.dongCode, daily)
        }
        return map
    })

    watch(selectedDate, (date) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            selectedMonth.value = toMonth(date)
        }
    })

    /**
     * 선택된 날짜에 데이터가 존재하는 시간 목록을 반환한다.
     * `monthlyData`가 없으면 빈 배열을 반환한다.
     *
     * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
     * @returns 오름차순 정렬된 `HH:00` 형식의 시간 배열
     */
    const resolveAvailableHours = (date: string): string[] => {
        if (!monthlyData.value) return []
        const hours = new Set<string>()
        for (const dong of monthlyData.value.dongs) {
            for (const slot of dong.hourly) {
                if (slot.date === date) {
                    hours.add(slot.time)
                }
            }
        }
        return Array.from(hours).sort((a, b) => a.localeCompare(b))
    }

    watch([selectedDate, monthlyData], ([date]) => {
        const availableHours = resolveAvailableHours(date)
        if (availableHours.length === 0) {
            return
        }

        if (!availableHours.includes(selectedHour.value)) {
            selectedHour.value = availableHours[0] ?? selectedHour.value
        }
    })

    return {
        selectedDate,
        selectedHour,
        selectedMonth,
        monthlyData,
        boundaryGeojson,
        isLoading,
        activeLayer,
        isVisible,
        dailySnapshot
    }
}
