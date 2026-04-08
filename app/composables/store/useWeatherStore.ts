import type { SeoulMonthlyWeather, DailyWeather, WeatherLayer } from '#shared/types/weather'

export const useWeatherStore = () => {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const thisMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`

  const selectedDate = useState<string>('weather.selectedDate', () => todayStr)
  const selectedMonth = useState<string>('weather.selectedMonth', () => thisMonth)
  const monthlyData = useState<SeoulMonthlyWeather | null>('weather.monthlyData', () => null)
  const boundaryGeojson = useState<unknown>('weather.boundaryGeojson', () => null)
  const isLoading = useState<boolean>('weather.isLoading', () => false)
  const activeLayer = useState<WeatherLayer>('weather.activeLayer', () => 'weather')
  const isVisible = useState<boolean>('weather.isVisible', () => true)

  /** 선택된 날짜의 동별 날씨 스냅샷 (dongCode → DailyWeather) */
  const dailySnapshot = computed<Map<string, DailyWeather>>(() => {
    const map = new Map<string, DailyWeather>()
    if (!monthlyData.value) return map

    for (const dong of monthlyData.value.dongs) {
      const daily = dong.monthly.find(d => d.date === selectedDate.value)
      if (daily) map.set(dong.dongCode, daily)
    }
    return map
  })

  return {
    selectedDate,
    selectedMonth,
    monthlyData,
    boundaryGeojson,
    isLoading,
    activeLayer,
    isVisible,
    dailySnapshot,
  }
}
