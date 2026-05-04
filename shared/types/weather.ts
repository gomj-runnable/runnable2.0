export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy'

export type Pm10Grade = 'good' | 'moderate' | 'bad' | 'very-bad'

export type WeatherLayer = 'weather' | 'temperature' | 'pm10'
export type WeatherSlotSource = 'observed' | 'forecast'
export type WeatherSourceKey = 'observed' | 'forecast' | 'airquality'

export interface HourlyWeather {
    date: string // "2025-04-08"
    time: string // "13:00"
    condition: WeatherCondition
    temperature: number // °C
    pm10: number | null // µg/m³
    pm10Grade: Pm10Grade | null
    pm25: number | null // µg/m³
    pm25Grade: Pm10Grade | null
    source: WeatherSlotSource
}

export interface DongWeather {
    dongCode: string // 법정동코드 (EMD_CD 5자리 또는 행정동 코드)
    dongName: string
    nx: number // 기상청 격자 x
    ny: number // 기상청 격자 y
    hourly: HourlyWeather[]
}

/** 소스별 에러 정보 */
export interface WeatherSourceError {
    source: WeatherSourceKey
    message: string
}

export interface SeoulMonthlyWeather {
    baseDate: string // "2026-04-09"
    rangeStart: string // "2026-03-10"
    rangeEnd: string // "2026-04-09"
    dongs: DongWeather[]
    /** 소스별 에러 목록 (부분 실패 시에도 데이터는 반환) */
    sourceErrors?: WeatherSourceError[]
    /** 실제 사용된 소스 목록 */
    activeSources?: WeatherSourceKey[]
}

/** 캘린더용 월별 가용일 응답 */
export interface MonthAvailability {
    month: string // "2026-04"
    availableDates: string[] // ["2026-04-01", ...]
    sourceAvailability: Record<string, string[]> // { observed: [...], forecast: [...] }
}

// ─── 원본 Response Classes ───

/** KMA TYP01 관측 텍스트 파싱 결과 (observed.adapter) */
export class KmaObservedOriginalResponse {
    rows: Array<Record<string, string>>
    constructor(rows: Array<Record<string, string>>) {
        this.rows = rows
    }
}

/** 기상청 동네예보 API 원본 아이템 */
export interface VilageFcstOriginalItem {
    category: string
    fcstDate: string
    fcstTime: string
    fcstValue: string
}

/** 기상청 동네예보 API 원본 응답 */
export class VilageFcstOriginalResponse {
    response?: {
        header?: { resultCode: string; resultMsg: string }
        body?: {
            items?: { item?: VilageFcstOriginalItem[] }
        }
    }
    constructor(data: unknown) {
        const parsed = data as Record<string, unknown>
        this.response = parsed?.response as typeof this.response
    }
}

/** 에어코리아 실시간 대기오염 측정 아이템 */
export interface AirKoreaRltmItem {
    dataTime: string // "2026-04-10 14:00"
    stationName: string // "종로구"
    pm10Value: string // "45" 또는 "-"
    pm10Grade: string // "1"~"4" 또는 "-"
    pm25Value: string // "23" 또는 "-"
    pm25Grade: string // "1"~"4" 또는 "-"
}

/** 에어코리아 실시간 대기오염 API 원본 응답 */
export class AirKoreaOriginalResponse {
    response?: {
        header?: { resultCode: string; resultMsg: string }
        body?: {
            items?: AirKoreaRltmItem[]
            totalCount?: number
        }
    }
    constructor(data: unknown) {
        const parsed = data as Record<string, unknown>
        this.response = parsed?.response as typeof this.response
    }
}
