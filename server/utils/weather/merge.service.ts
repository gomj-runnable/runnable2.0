import type { HourlyWeather, WeatherSlotSource } from '#shared/types/weather'
import {
    addDays,
    addHours,
    buildFallbackSlot,
    formatDate,
    formatHour,
    parseSlotDateTime,
    toDateOnly,
    toSlotDateTimeKey,
    withKstHour
} from './common'

interface MergeWeatherSlotsOptions {
    baseDate: Date
    observedSlots: HourlyWeather[]
    forecastSlots: HourlyWeather[]
}

const sourcePriority: Record<WeatherSlotSource, number> = {
    fallback: 1,
    forecast: 2,
    observed: 3
}

const slotPriority = (slot: HourlyWeather): number => sourcePriority[slot.source ?? 'fallback']

const isInsideRange = (date: Date, start: Date, end: Date): boolean =>
    date.getTime() >= start.getTime() && date.getTime() <= end.getTime()

export const mergeWeatherSlots = ({
    baseDate,
    observedSlots,
    forecastSlots
}: MergeWeatherSlotsOptions): HourlyWeather[] => {
    const rangeStart = toDateOnly(addDays(baseDate, -30))
    const rangeEnd = withKstHour(addDays(baseDate, 31), 23)

    const preferredByHour = new Map<string, HourlyWeather>()

    const putWithPriority = (slot: HourlyWeather) => {
        const date = parseSlotDateTime(slot)
        if (!isInsideRange(date, rangeStart, rangeEnd)) {
            return
        }

        const key = toSlotDateTimeKey(slot)
        const prev = preferredByHour.get(key)
        if (!prev || slotPriority(slot) > slotPriority(prev)) {
            preferredByHour.set(key, slot)
        }
    }

    observedSlots.forEach(putWithPriority)
    forecastSlots.forEach(putWithPriority)

    const merged: HourlyWeather[] = []
    for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addHours(cursor, 1)) {
        const key = `${formatDate(cursor)}T${formatHour(cursor)}`
        const slot = preferredByHour.get(key) ?? buildFallbackSlot(cursor)
        merged.push(slot)
    }

    return merged
}
