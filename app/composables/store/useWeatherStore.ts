import type { SeoulMonthlyWeather, HourlyWeather, WeatherLayer } from '#shared/types/weather'

export const useWeatherStore = () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const thisHour = `${String(today.getHours()).padStart(2, '0')}:00`
    const toMonth = (date: string): string => date.slice(0, 7).replace('-', '')

    const selectedDate = useState<string>('weather.selectedDate', () => todayStr)
    const selectedHour = useState<string>('weather.selectedHour', () => thisHour)
    const selectedMonth = useState<string>('weather.selectedMonth', () => toMonth(todayStr))
    const monthlyData = useState<SeoulMonthlyWeather | null>('weather.monthlyData', () => null)
    const boundaryGeojson = useState<unknown>('weather.boundaryGeojson', () => null)
    const isLoading = useState<boolean>('weather.isLoading', () => false)
    const activeLayer = useState<WeatherLayer>('weather.activeLayer', () => 'weather')
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
