import type { HourlyWeather, Pm10Grade, WeatherCondition } from '#shared/types/weather'
import { Pm10GradeEnum } from '#shared/types/pm10-grade.enum'
import type { AirQualitySlot } from './airquality.adapter'

export interface IObservedWeatherAdapter {
    fetchSlots(authKey: string, start: Date, end: Date): Promise<HourlyWeather[]>
}

export interface IForecastAdapter {
    fetchSlots(serviceKey: string, requestedDate: string, now?: Date): Promise<HourlyWeather[]>
}

export interface IAirQualityAdapter {
    fetchSeoulAirQuality(serviceKey: string): Promise<Map<string, AirQualitySlot[]>>
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

export const mapPm10Grade = (pm10: number): Pm10Grade =>
    Pm10GradeEnum.fromValue(pm10).key as Pm10Grade

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
