import { describe, it, expect, vi, beforeEach } from 'vitest'

// SEOUL_GU_DATA 의존 — 실제 데이터 그대로 사용. WeatherFacade._enrichWithAirQuality 가 25 구를 모두 순회.
import { weatherService } from '../weather.service'

const observedFetch = vi.hoisted(() => vi.fn())
const forecastFetch = vi.hoisted(() => vi.fn())
const airFetch = vi.hoisted(() => vi.fn())
const mergeWeatherSlots = vi.hoisted(() => vi.fn())

vi.mock('../observed.service', () => ({
    ObservedService: class {
        fetch = observedFetch
    }
}))
vi.mock('../forecast.service', () => ({
    ForecastService: class {
        fetch = forecastFetch
    }
}))
vi.mock('../airquality.service', () => ({
    AirQualityService: class {
        fetch = airFetch
    }
}))
vi.mock('../merge.service', () => ({ mergeWeatherSlots }))

const baseSlot = (overrides: any = {}) => ({
    date: '2026-05-22',
    time: '10:00',
    temperature: 20,
    condition: 'clear',
    pm10: null,
    pm10Grade: null,
    pm25: null,
    pm25Grade: null,
    source: 'observed',
    ...overrides
})

describe('weatherService (WeatherFacade)', () => {
    beforeEach(() => {
        observedFetch.mockReset().mockResolvedValue({ slots: [], error: null })
        forecastFetch.mockReset().mockResolvedValue({ slots: [], error: null })
        airFetch.mockReset().mockResolvedValue({ dataByGu: new Map(), error: null })
        mergeWeatherSlots.mockReset().mockReturnValue([])
    })

    it('잘못된 월 형식이면 throw', async () => {
        await expect(weatherService.requestByMonth('2026/05')).rejects.toThrow(/Invalid month/)
    })

    it('정상 호출: merge 결과 + 25개 dong 반환 + activeSources 포함', async () => {
        mergeWeatherSlots.mockReturnValue([baseSlot()])

        const result = await weatherService.requestByMonth('2026-05', {
            authKey: 'a',
            openDataKey: 'b',
            airKoreaKey: 'c'
        })

        expect(observedFetch).toHaveBeenCalled()
        expect(forecastFetch).toHaveBeenCalled()
        expect(airFetch).toHaveBeenCalled()
        expect(result.dongs).toHaveLength(25)
        expect(result.dongs[0].hourly).toHaveLength(1)
        expect(result.activeSources).toContain('observed')
        expect(result.activeSources).toContain('forecast')
        expect(result.activeSources).toContain('airquality')
    })

    it('key 가 없는 source 는 fetch 호출 안 함', async () => {
        await weatherService.requestByMonth('2026-05', {}) // 모든 key 미지정

        expect(observedFetch).not.toHaveBeenCalled()
        expect(forecastFetch).not.toHaveBeenCalled()
        expect(airFetch).not.toHaveBeenCalled()
    })

    it('sources 옵션으로 일부만 호출 가능', async () => {
        await weatherService.requestByMonth('2026-05', {
            authKey: 'a',
            openDataKey: 'b',
            airKoreaKey: 'c',
            sources: ['observed']
        })

        expect(observedFetch).toHaveBeenCalled()
        expect(forecastFetch).not.toHaveBeenCalled()
        expect(airFetch).not.toHaveBeenCalled()
    })

    it('각 source 에러는 sourceErrors 로 모아진다', async () => {
        observedFetch.mockResolvedValue({
            slots: [],
            error: { source: 'observed', message: 'x' }
        })
        forecastFetch.mockResolvedValue({
            slots: [],
            error: { source: 'forecast', message: 'y' }
        })
        airFetch.mockResolvedValue({
            dataByGu: new Map(),
            error: { source: 'airquality', message: 'z' }
        })

        const result = await weatherService.requestByMonth('2026-05', {
            authKey: 'a',
            openDataKey: 'b',
            airKoreaKey: 'c'
        })

        expect(result.sourceErrors).toHaveLength(3)
    })

    it('AirQuality 매칭: pm10 이 null 이면 보충, pm25 는 항상 덮어쓰기', async () => {
        mergeWeatherSlots.mockReturnValue([
            baseSlot({ pm10: 30, pm25: null }), // pm10 이미 있음, pm25 없음
            baseSlot({ time: '11:00', pm10: null, pm25: null }) // 둘 다 없음
        ])
        // 첫 번째 구만 매칭되는 air slot 제공
        const guCode = '11110' // SEOUL_GU_DATA 첫 번째 (종로구)
        const airData = new Map([
            [
                guCode,
                [
                    {
                        dataTime: '2026-05-22 10:00',
                        pm10: 99,
                        pm25: 50
                    },
                    {
                        dataTime: '2026-05-22 11:00',
                        pm10: 88,
                        pm25: 40
                    }
                ] as any
            ]
        ])
        airFetch.mockResolvedValue({ dataByGu: airData, error: null })

        const result = await weatherService.requestByMonth('2026-05', { airKoreaKey: 'k' })

        const jongno = result.dongs.find((d) => d.dongCode === guCode)
        expect(jongno).toBeDefined()
        // pm10 이미 있던 첫 슬롯은 그대로 30, pm25 는 새로 들어옴
        expect(jongno!.hourly[0].pm10).toBe(30)
        expect(jongno!.hourly[0].pm25).toBe(50)
        // pm10 null 이던 둘째 슬롯은 88 로 보충
        expect(jongno!.hourly[1].pm10).toBe(88)
        expect(jongno!.hourly[1].pm25).toBe(40)
    })

    it('requestByDate: 날짜 → 해당 월 조회로 위임 (today fallback 포함)', async () => {
        const spy = vi.spyOn(weatherService, 'requestByMonth')
        spy.mockResolvedValue({
            baseDate: '2026-05-01',
            rangeStart: '',
            rangeEnd: '',
            dongs: [],
            activeSources: []
        } as any)

        await weatherService.requestByDate('2026-05-22')
        expect(spy).toHaveBeenCalledWith('2026-05', expect.anything())

        await weatherService.requestByDate() // today
        expect(spy.mock.calls[1][0]).toMatch(/^\d{4}-\d{2}$/)

        spy.mockRestore()
    })

    it('getAvailability: source 별 + 통합 날짜 집합 반환', async () => {
        mergeWeatherSlots.mockReturnValue([
            baseSlot({ date: '2026-05-01', source: 'observed' }),
            baseSlot({ date: '2026-05-02', source: 'forecast' }),
            baseSlot({ date: '2026-05-03', source: 'observed', pm10: 50 })
        ])

        const result = await weatherService.getAvailability('2026-05')

        expect(result.month).toBe('2026-05')
        expect(result.sourceAvailability.observed).toEqual(['2026-05-01', '2026-05-03'])
        expect(result.sourceAvailability.forecast).toEqual(['2026-05-02'])
        expect(result.sourceAvailability.airquality).toEqual(['2026-05-03'])
        expect(result.availableDates).toEqual(['2026-05-01', '2026-05-02', '2026-05-03'])
    })
})
