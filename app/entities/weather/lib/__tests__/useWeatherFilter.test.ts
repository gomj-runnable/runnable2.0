import { describe, it, expect } from 'vitest'
import {
    filterSlotsBySource,
    filterAvailableDatesBySource
} from '~/entities/weather/lib/useWeatherFilter'
import type { HourlyWeather } from '#shared/types/weather'

const slot = (overrides: Partial<HourlyWeather>): HourlyWeather =>
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
        ...overrides
    }) as HourlyWeather

describe('filterSlotsBySource()', () => {
    it('null 이면 원본 그대로', () => {
        const slots = [slot({ source: 'observed' }), slot({ source: 'forecast' })]
        expect(filterSlotsBySource(slots, null)).toBe(slots)
    })

    it('observed/forecast 는 source 필드 매칭', () => {
        const slots = [slot({ source: 'observed' }), slot({ source: 'forecast' })]
        expect(filterSlotsBySource(slots, 'observed')).toHaveLength(1)
        expect(filterSlotsBySource(slots, 'observed')[0]!.source).toBe('observed')
    })

    it('airquality 는 pm10 이 있는 슬롯만 통과', () => {
        const slots = [slot({ pm10: 50 }), slot({ pm10: null }), slot({ pm10: 80 })]
        expect(filterSlotsBySource(slots, 'airquality')).toHaveLength(2)
    })
})

describe('filterAvailableDatesBySource()', () => {
    it('source 지정 시 그 source 의 날짜만', () => {
        const result = filterAvailableDatesBySource(
            { observed: ['2026-05-15'], forecast: ['2026-05-20'] },
            'observed'
        )
        expect(Array.from(result)).toEqual(['2026-05-15'])
    })

    it('존재하지 않는 source → 빈 Set', () => {
        const result = filterAvailableDatesBySource({ observed: ['2026-05-15'] }, 'forecast')
        expect(result.size).toBe(0)
    })

    it('null → 모든 source 의 합집합 (중복 제거)', () => {
        const result = filterAvailableDatesBySource(
            { observed: ['2026-05-15', '2026-05-16'], forecast: ['2026-05-16', '2026-05-17'] },
            null
        )
        expect(result.size).toBe(3)
        expect(result.has('2026-05-16')).toBe(true)
    })
})
