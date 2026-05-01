import { describe, it, expect } from 'vitest'
import { mergeWeatherSlots } from '../merge.service'
import { fromKstParts } from '../common'
import type { HourlyWeather } from '#shared/types/weather'

const makeSlot = (
    date: string,
    time: string,
    source: 'observed' | 'forecast',
    temperature = 20
): HourlyWeather => ({
    date,
    time,
    condition: 'clear',
    temperature,
    pm10: null,
    pm10Grade: null,
    source
})

describe('mergeWeatherSlots', () => {
    const rangeStart = fromKstParts(2025, 4, 8, 10, 0)
    const rangeEnd = fromKstParts(2025, 4, 8, 13, 0)

    it('관측 슬롯만 있을 때 범위 내 슬롯을 반환한다', () => {
        const observed = [
            makeSlot('2025-04-08', '10:00', 'observed', 15),
            makeSlot('2025-04-08', '11:00', 'observed', 16),
            makeSlot('2025-04-08', '12:00', 'observed', 17)
        ]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: observed,
            forecastSlots: []
        })
        expect(result).toHaveLength(3)
        expect(result.every((s) => s.source === 'observed')).toBe(true)
    })

    it('예보 슬롯만 있을 때 범위 내 슬롯을 반환한다', () => {
        const forecast = [
            makeSlot('2025-04-08', '10:00', 'forecast', 15),
            makeSlot('2025-04-08', '11:00', 'forecast', 16)
        ]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: [],
            forecastSlots: forecast
        })
        expect(result).toHaveLength(2)
        expect(result.every((s) => s.source === 'forecast')).toBe(true)
    })

    it('같은 시각에 관측과 예보가 있으면 관측이 우선한다', () => {
        const observed = [makeSlot('2025-04-08', '11:00', 'observed', 99)]
        const forecast = [makeSlot('2025-04-08', '11:00', 'forecast', 1)]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: observed,
            forecastSlots: forecast
        })
        expect(result).toHaveLength(1)
        expect(result[0]!.source).toBe('observed')
        expect(result[0]!.temperature).toBe(99)
    })

    it('관측과 예보가 서로 다른 시각을 커버하면 모두 포함된다', () => {
        const observed = [makeSlot('2025-04-08', '10:00', 'observed', 10)]
        const forecast = [makeSlot('2025-04-08', '12:00', 'forecast', 20)]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: observed,
            forecastSlots: forecast
        })
        expect(result).toHaveLength(2)
        const sources = result.map((s) => s.source)
        expect(sources).toContain('observed')
        expect(sources).toContain('forecast')
    })

    it('범위 밖 슬롯은 포함되지 않는다', () => {
        const observed = [
            makeSlot('2025-04-08', '09:00', 'observed', 5), // rangeStart 이전
            makeSlot('2025-04-08', '10:00', 'observed', 10), // 범위 내
            makeSlot('2025-04-08', '14:00', 'observed', 30) // rangeEnd 이후
        ]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: observed,
            forecastSlots: []
        })
        expect(result).toHaveLength(1)
        expect(result[0]!.time).toBe('10:00')
    })

    it('관측과 예보 모두 비어있으면 빈 배열을 반환한다', () => {
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: [],
            forecastSlots: []
        })
        expect(result).toHaveLength(0)
    })

    it('rangeStart와 rangeEnd가 같으면 해당 시각 슬롯만 반환한다', () => {
        const singlePoint = fromKstParts(2025, 4, 8, 10, 0)
        const observed = [makeSlot('2025-04-08', '10:00', 'observed', 10)]
        const result = mergeWeatherSlots({
            rangeStart: singlePoint,
            rangeEnd: singlePoint,
            observedSlots: observed,
            forecastSlots: []
        })
        expect(result).toHaveLength(1)
    })

    it('결과는 시간 오름차순으로 정렬된다', () => {
        const observed = [
            makeSlot('2025-04-08', '12:00', 'observed', 17),
            makeSlot('2025-04-08', '10:00', 'observed', 15),
            makeSlot('2025-04-08', '11:00', 'observed', 16)
        ]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: observed,
            forecastSlots: []
        })
        expect(result.map((s) => s.time)).toEqual(['10:00', '11:00', '12:00'])
    })

    it('관측이 예보보다 늦게 처리돼도 우선순위가 유지된다', () => {
        // forecastSlots를 먼저 처리하고 observedSlots를 나중에 처리해도
        // observed가 forecast를 덮어써야 한다.
        const observed = [makeSlot('2025-04-08', '10:00', 'observed', 55)]
        const forecast = [makeSlot('2025-04-08', '10:00', 'forecast', 1)]
        const result = mergeWeatherSlots({
            rangeStart,
            rangeEnd,
            observedSlots: observed,
            forecastSlots: forecast
        })
        expect(result[0]!.source).toBe('observed')
        expect(result[0]!.temperature).toBe(55)
    })
})
