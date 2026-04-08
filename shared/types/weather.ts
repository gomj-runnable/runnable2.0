export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy'

export type Pm10Grade = 'good' | 'moderate' | 'bad' | 'very-bad'

export type WeatherLayer = 'weather' | 'temperature' | 'pm10'

export interface DailyWeather {
  date: string           // "2025-04-08"
  condition: WeatherCondition
  tempMin: number        // °C
  tempMax: number        // °C
  pm10: number           // µg/m³
  pm10Grade: Pm10Grade
}

export interface DongWeather {
  dongCode: string       // 법정동코드 (EMD_CD 5자리 또는 행정동 코드)
  dongName: string
  nx: number             // 기상청 격자 x
  ny: number             // 기상청 격자 y
  monthly: DailyWeather[]
}

export interface SeoulMonthlyWeather {
  year: number
  month: number
  dongs: DongWeather[]
}
