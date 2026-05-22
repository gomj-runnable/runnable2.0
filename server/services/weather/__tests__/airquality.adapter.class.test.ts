import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AirQualityAdapter } from '../airquality.adapter'

// stationName=종로구 인 응답
const sampleResponse = (overrides?: Partial<{ pm10: string; pm25: string }>) => ({
    response: {
        header: { resultCode: '00', resultMsg: 'OK' },
        body: {
            items: [
                {
                    dataTime: '2026-05-15 14:00',
                    stationName: '종로구',
                    pm10Value: overrides?.pm10 ?? '45',
                    pm10Grade: '2',
                    pm25Value: overrides?.pm25 ?? '23',
                    pm25Grade: '2'
                }
            ]
        }
    }
})

describe('AirQualityAdapter.fetchSeoulAirQuality()', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-05-15T14:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('serviceKey 가 빈 문자열이면 빈 Map 반환', async () => {
        const adapter = new AirQualityAdapter()
        const result = await adapter.fetchSeoulAirQuality('   ')
        expect(result.size).toBe(0)
    })

    it('25개 구 모두 fetch 호출되고 guCode 키로 슬롯이 반환', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse()
        } as unknown as Response)
        const adapter = new AirQualityAdapter()
        const result = await adapter.fetchSeoulAirQuality('key')
        expect(fetchSpy).toHaveBeenCalledTimes(25)
        expect(result.size).toBe(25)
        // 종로구 코드 11110 에 대한 슬롯 (단, 응답이 모든 구에 동일하게 들어와도 stationName='종로구' 만 매핑)
        const jongnoSlots = result.get('11110')
        expect(jongnoSlots).toBeDefined()
    })

    it('pm10/pm25 가 "-" 이면 null + grade null', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse({ pm10: '-', pm25: '-' })
        } as unknown as Response)
        const adapter = new AirQualityAdapter()
        const result = await adapter.fetchSeoulAirQuality('key')
        const slots = result.get('11110')
        expect(slots).toBeDefined()
        expect(slots![0]!.pm10).toBeNull()
        expect(slots![0]!.pm10Grade).toBeNull()
        expect(slots![0]!.pm25).toBeNull()
        expect(slots![0]!.pm25Grade).toBeNull()
    })

    it('두 번째 호출 — 1시간 캐시 사용 (fetch 추가 호출 없음)', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse()
        } as unknown as Response)
        const adapter = new AirQualityAdapter()
        await adapter.fetchSeoulAirQuality('key')
        expect(fetchSpy).toHaveBeenCalledTimes(25)
        await adapter.fetchSeoulAirQuality('key')
        expect(fetchSpy).toHaveBeenCalledTimes(25) // 동일
    })

    it('캐시 TTL(1시간) 경과 후 재호출 — fetch 다시 발생', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse()
        } as unknown as Response)
        const adapter = new AirQualityAdapter()
        await adapter.fetchSeoulAirQuality('key')
        expect(fetchSpy).toHaveBeenCalledTimes(25)

        // 1시간 1분 경과
        vi.setSystemTime(new Date('2026-05-15T15:01:00Z'))
        await adapter.fetchSeoulAirQuality('key')
        expect(fetchSpy).toHaveBeenCalledTimes(50)
    })

    it('fetch 실패한 구는 결과에서 제외', async () => {
        let callCount = 0
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
            callCount++
            if (callCount === 1) {
                return { ok: false, status: 500 } as unknown as Response
            }
            return { ok: true, json: async () => sampleResponse() } as unknown as Response
        })
        const adapter = new AirQualityAdapter()
        const result = await adapter.fetchSeoulAirQuality('key')
        // 25개 중 1개 실패 → 24 개만 결과
        expect(result.size).toBe(24)
    })
})

describe('AirQualityAdapter.fetchLatestPm10Map()', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-05-15T14:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('각 guCode 별 첫 non-null pm10 을 Map 으로 반환', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse({ pm10: '50' })
        } as unknown as Response)
        const adapter = new AirQualityAdapter()
        const map = await adapter.fetchLatestPm10Map('key')
        expect(map.get('11110')).toBe(50)
    })

    it('pm10 이 모두 null 인 구는 결과에서 제외', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse({ pm10: '-' })
        } as unknown as Response)
        const adapter = new AirQualityAdapter()
        const map = await adapter.fetchLatestPm10Map('key')
        expect(map.size).toBe(0)
    })
})
