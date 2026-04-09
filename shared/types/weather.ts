export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy'

export type Pm10Grade = 'good' | 'moderate' | 'bad' | 'very-bad'

export type WeatherLayer = 'weather' | 'temperature' | 'pm10'
export type WeatherSlotSource = 'observed' | 'forecast' | 'fallback'

export interface HourlyWeather {
    date: string // "2025-04-08"
    time: string // "13:00"
    condition: WeatherCondition
    temperature: number // °C
    pm10: number | null // µg/m³
    pm10Grade: Pm10Grade | null
    source?: WeatherSlotSource
}

export interface DongWeather {
    dongCode: string // 법정동코드 (EMD_CD 5자리 또는 행정동 코드)
    dongName: string
    nx: number // 기상청 격자 x
    ny: number // 기상청 격자 y
    hourly: HourlyWeather[]
}

export interface SeoulMonthlyWeather {
    baseDate: string // "2026-04-09"
    rangeStart: string // "2026-03-10"
    rangeEnd: string // "2026-04-09"
    dongs: DongWeather[]
}
