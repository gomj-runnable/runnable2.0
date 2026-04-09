import type { HourlyWeather, Pm10Grade, WeatherCondition } from '#shared/types/weather'

export interface SeoulGridEntry {
    name: string
    nx: number
    ny: number
    guCode: string
}

export const SEOUL_GU_GRID: Record<string, SeoulGridEntry> = {
    '11110': { name: '종로구', nx: 60, ny: 127, guCode: '11110' },
    '11140': { name: '중구', nx: 60, ny: 127, guCode: '11140' },
    '11170': { name: '용산구', nx: 60, ny: 126, guCode: '11170' },
    '11200': { name: '성동구', nx: 61, ny: 127, guCode: '11200' },
    '11215': { name: '광진구', nx: 62, ny: 127, guCode: '11215' },
    '11230': { name: '동대문구', nx: 61, ny: 127, guCode: '11230' },
    '11260': { name: '중랑구', nx: 62, ny: 128, guCode: '11260' },
    '11290': { name: '성북구', nx: 61, ny: 127, guCode: '11290' },
    '11305': { name: '강북구', nx: 61, ny: 128, guCode: '11305' },
    '11320': { name: '도봉구', nx: 61, ny: 129, guCode: '11320' },
    '11350': { name: '노원구', nx: 61, ny: 129, guCode: '11350' },
    '11380': { name: '은평구', nx: 59, ny: 127, guCode: '11380' },
    '11410': { name: '서대문구', nx: 59, ny: 127, guCode: '11410' },
    '11440': { name: '마포구', nx: 59, ny: 127, guCode: '11440' },
    '11470': { name: '양천구', nx: 58, ny: 126, guCode: '11470' },
    '11500': { name: '강서구', nx: 58, ny: 126, guCode: '11500' },
    '11530': { name: '구로구', nx: 58, ny: 125, guCode: '11530' },
    '11545': { name: '금천구', nx: 59, ny: 124, guCode: '11545' },
    '11560': { name: '영등포구', nx: 58, ny: 126, guCode: '11560' },
    '11590': { name: '동작구', nx: 59, ny: 126, guCode: '11590' },
    '11620': { name: '관악구', nx: 59, ny: 125, guCode: '11620' },
    '11650': { name: '서초구', nx: 61, ny: 125, guCode: '11650' },
    '11680': { name: '강남구', nx: 61, ny: 126, guCode: '11680' },
    '11710': { name: '송파구', nx: 62, ny: 126, guCode: '11710' },
    '11740': { name: '강동구', nx: 62, ny: 126, guCode: '11740' }
}

export const SEOUL_ASOS_STATION = 108
export const KMA_TYP01_BASE_URL = 'https://apihub.kma.go.kr/api/typ01/url'
const KST_OFFSET_MINUTES = 9 * 60

type KstParts = { year: number; month: number; day: number; hour: number; minute: number }

const toKstParts = (date: Date): KstParts => {
    const shifted = new Date(date.getTime() + KST_OFFSET_MINUTES * 60_000)
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate(),
        hour: shifted.getUTCHours(),
        minute: shifted.getUTCMinutes()
    }
}

export const fromKstParts = (
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0
): Date => new Date(Date.UTC(year, month - 1, day, hour, minute) - KST_OFFSET_MINUTES * 60_000)

export const toDateOnly = (date: Date): Date => {
    const parts = toKstParts(date)
    return fromKstParts(parts.year, parts.month, parts.day, 0, 0)
}

export const addDays = (date: Date, days: number): Date => {
    const parts = toKstParts(date)
    return fromKstParts(parts.year, parts.month, parts.day + days, parts.hour, parts.minute)
}

export const addHours = (date: Date, hours: number): Date => {
    return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

export const withKstHour = (date: Date, hour: number): Date => {
    const parts = toKstParts(date)
    return fromKstParts(parts.year, parts.month, parts.day, hour, 0)
}

export const truncateToKstHour = (date: Date): Date => {
    const parts = toKstParts(date)
    return fromKstParts(parts.year, parts.month, parts.day, parts.hour, 0)
}

export const getKstHour = (date: Date): number => {
    const parts = toKstParts(date)
    return parts.hour
}

export const formatDate = (date: Date): string => {
    const { year, month, day } = toKstParts(date)
    const y = year
    const m = String(month).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export const formatHour = (date: Date): string => `${String(getKstHour(date)).padStart(2, '0')}:00`

export const formatYmd = (date: Date): string => {
    const { year, month, day } = toKstParts(date)
    return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
}

export const formatKstMinute = (date: Date): string => {
    const { year, month, day, hour } = toKstParts(date)
    const y = year
    const m = String(month).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const hh = String(hour).padStart(2, '0')
    return `${y}${m}${d}${hh}00`
}

export const parseYmd = (value: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    const [yearRaw = '', monthRaw = '', dayRaw = ''] = value.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    const day = Number(dayRaw)
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null

    const date = fromKstParts(year, month, day, 0, 0)
    if (formatDate(date) !== value) {
        return null
    }

    return date
}

export const parseNumber = (value?: string | number | null): number | null => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (!value || value === '-9' || value === '-9.0' || value === '///' || value === 'NaN') {
        return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

export const toSlotDateTimeKey = (slot: Pick<HourlyWeather, 'date' | 'time'>): string =>
    `${slot.date}T${slot.time}`

export const parseSlotDateTime = (slot: Pick<HourlyWeather, 'date' | 'time'>): Date => {
    const [yearRaw = '', monthRaw = '', dayRaw = ''] = slot.date.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    const day = Number(dayRaw)
    const hour = Number(slot.time.slice(0, 2))
    return fromKstParts(year, month, day, hour, 0)
}

export const mapPm10Grade = (pm10: number): Pm10Grade => {
    if (pm10 <= 30) return 'good'
    if (pm10 <= 80) return 'moderate'
    if (pm10 <= 150) return 'bad'
    return 'very-bad'
}

export const mapConditionByCloudAndRain = (
    temperature: number,
    rainfall: number | null,
    cloudAmount: number | null
): WeatherCondition => {
    if ((rainfall ?? 0) > 0) {
        return temperature <= 0 ? 'snowy' : 'rainy'
    }

    if (cloudAmount === null) {
        return 'clear'
    }

    if (cloudAmount <= 2) return 'clear'
    if (cloudAmount <= 7) return 'partly-cloudy'
    return 'cloudy'
}

export const mapConditionByPrecipitation = (
    temperature: number,
    precipitation: number | null,
    snowfall: number | null,
    cloudCover: number | null
): WeatherCondition => {
    if ((snowfall ?? 0) > 0) {
        return 'snowy'
    }

    if ((precipitation ?? 0) > 0) {
        return temperature <= 0 ? 'snowy' : 'rainy'
    }

    if (cloudCover === null) {
        return 'clear'
    }

    if (cloudCover <= 25) return 'clear'
    if (cloudCover <= 70) return 'partly-cloudy'
    return 'cloudy'
}

export const buildFallbackSlot = (date: Date): HourlyWeather => {
    const { hour, month } = toKstParts(date)
    const daytimeCurve = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
    const seasonalBias = Math.sin((month / 12) * Math.PI)
    const temperature = Number((7 + daytimeCurve * 11 + seasonalBias * 5).toFixed(1))

    return {
        date: formatDate(date),
        time: formatHour(date),
        condition: hour >= 6 && hour <= 18 ? 'partly-cloudy' : 'cloudy',
        temperature,
        pm10: null,
        pm10Grade: null,
        source: 'fallback'
    }
}
