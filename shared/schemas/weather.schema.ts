import { z } from 'zod'
import type {
    HourlyWeather,
    DongWeather,
    SeoulMonthlyWeather,
    MonthAvailability,
    WeatherSourceError
} from '#shared/types/weather'

export const weatherConditionSchema = z.enum(['clear', 'partly-cloudy', 'cloudy', 'rainy', 'snowy'])

export const pm10GradeSchema = z.enum(['good', 'moderate', 'bad', 'very-bad'])

export const weatherSlotSourceSchema = z.enum(['observed', 'forecast'])

export const weatherSourceKeySchema = z.enum(['observed', 'forecast', 'airquality'])

export const hourlyWeatherSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    condition: weatherConditionSchema,
    temperature: z.number(),
    pm10: z.number().nullable(),
    pm10Grade: pm10GradeSchema.nullable(),
    pm25: z.number().nullable(),
    pm25Grade: pm10GradeSchema.nullable(),
    source: weatherSlotSourceSchema
}) satisfies z.ZodType<HourlyWeather>

export const dongWeatherSchema = z.object({
    dongCode: z.string(),
    dongName: z.string(),
    nx: z.number(),
    ny: z.number(),
    hourly: z.array(hourlyWeatherSchema)
}) satisfies z.ZodType<DongWeather>

export const weatherSourceErrorSchema = z.object({
    source: weatherSourceKeySchema,
    message: z.string()
}) satisfies z.ZodType<WeatherSourceError>

export const seoulMonthlyWeatherSchema = z.object({
    baseDate: z.string(),
    rangeStart: z.string(),
    rangeEnd: z.string(),
    dongs: z.array(dongWeatherSchema),
    sourceErrors: z.array(weatherSourceErrorSchema).optional(),
    activeSources: z.array(weatherSourceKeySchema).optional()
}) satisfies z.ZodType<SeoulMonthlyWeather>

export const monthAvailabilitySchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    availableDates: z.array(z.string()),
    sourceAvailability: z.record(z.string(), z.array(z.string()))
}) satisfies z.ZodType<MonthAvailability>
