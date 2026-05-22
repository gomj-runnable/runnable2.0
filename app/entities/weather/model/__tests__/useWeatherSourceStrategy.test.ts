import { describe, it, expect, beforeEach } from 'vitest'
import { useWeatherSourceStrategy } from '~/entities/weather/model/useWeatherSourceStrategy'
import { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import type { HourlyWeather } from '#shared/types/weather'

const slot = (s: Partial<HourlyWeather>): HourlyWeather =>
    ({
        date: '2026-05-15',
        time: '14:00',
        source: 'observed',
        temperature: 20,
        condition: 'clear',
        pm10: null,
        pm10Grade: null,
        pm25: null,
        pm25Grade: null,
        ...s
    }) as HourlyWeather

describe('useWeatherSourceStrategy', () => {
    let store: ReturnType<typeof useWeatherSourceStrategy>

    beforeEach(() => {
        store = useWeatherSourceStrategy()
        store.activeSourceFilter.value = null
        store.sourceAvailability.value = {}
    })

    it('초기 — activeSourceFilter null', () => {
        expect(store.activeSourceFilter.value).toBeNull()
    })

    it('syncSourceFromLayer — WEATHER → forecast', () => {
        store.syncSourceFromLayer(WeatherLayerEnum.WEATHER)
        expect(store.activeSourceFilter.value).toBe('forecast')
    })

    it('syncSourceFromLayer — TEMPERATURE → observed', () => {
        store.syncSourceFromLayer(WeatherLayerEnum.TEMPERATURE)
        expect(store.activeSourceFilter.value).toBe('observed')
    })

    it('syncSourceFromLayer — PM10 → airquality', () => {
        store.syncSourceFromLayer(WeatherLayerEnum.PM10)
        expect(store.activeSourceFilter.value).toBe('airquality')
    })

    it('syncSourceFromLayer(null) → null', () => {
        store.syncSourceFromLayer(WeatherLayerEnum.WEATHER)
        store.syncSourceFromLayer(null)
        expect(store.activeSourceFilter.value).toBeNull()
    })

    it('filteredAvailableDates — null source 면 모든 날짜 합집합', () => {
        store.sourceAvailability.value = {
            forecast: ['2026-05-15'],
            observed: ['2026-05-16']
        }
        expect(store.filteredAvailableDates.value.size).toBe(2)
    })

    it('filteredAvailableDates — 특정 source 만', () => {
        store.sourceAvailability.value = {
            forecast: ['2026-05-15'],
            observed: ['2026-05-16']
        }
        store.activeSourceFilter.value = 'forecast'
        expect(Array.from(store.filteredAvailableDates.value)).toEqual(['2026-05-15'])
    })

    it('filterSlots — source 필터 적용', () => {
        store.activeSourceFilter.value = 'forecast'
        const slots = [slot({ source: 'forecast' }), slot({ source: 'observed' })]
        expect(store.filterSlots(slots)).toHaveLength(1)
    })
})
