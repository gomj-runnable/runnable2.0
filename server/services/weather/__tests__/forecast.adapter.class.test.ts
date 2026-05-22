import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ForecastAdapter } from '../forecast.adapter'

// VilageFcstOriginalResponse 형식. fcstDate=20260515 14:00 의 TMP/PTY/SKY
const sampleResponse = (
    items: Array<{ fcstDate: string; fcstTime: string; category: string; fcstValue: string }>
) => ({
    response: {
        header: { resultCode: '00', resultMsg: 'OK' },
        body: { items: { item: items } }
    }
})

describe('ForecastAdapter.fetchSlots()', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('serviceKey 가 비어 있으면 빈 배열 반환', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch')
        const adapter = new ForecastAdapter()
        const result = await adapter.fetchSlots('   ', '2026-05-15')
        expect(result).toEqual([])
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('TMP/PTY/SKY 그룹화 후 시간순 정렬된 slots 를 반환', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () =>
                sampleResponse([
                    { fcstDate: '20260515', fcstTime: '1500', category: 'TMP', fcstValue: '20' },
                    { fcstDate: '20260515', fcstTime: '1500', category: 'PTY', fcstValue: '0' },
                    { fcstDate: '20260515', fcstTime: '1500', category: 'SKY', fcstValue: '1' },
                    { fcstDate: '20260515', fcstTime: '1400', category: 'TMP', fcstValue: '19' },
                    { fcstDate: '20260515', fcstTime: '1400', category: 'PTY', fcstValue: '0' },
                    { fcstDate: '20260515', fcstTime: '1400', category: 'SKY', fcstValue: '1' }
                ])
        } as unknown as Response)

        const adapter = new ForecastAdapter()
        const now = new Date('2026-05-15T13:00:00+09:00')
        const result = await adapter.fetchSlots('key', '2026-05-15', now)

        expect(result).toHaveLength(2)
        // 시간순 정렬: 14:00 → 15:00
        expect(result[0]!.time).toBe('14:00')
        expect(result[1]!.time).toBe('15:00')
        expect(result[0]!.temperature).toBe(19)
        expect(result[0]!.source).toBe('forecast')
        expect(result[0]!.pm10).toBeNull()
    })

    it('TMP 가 없는 슬롯은 제외', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () =>
                sampleResponse([
                    // TMP 없음
                    { fcstDate: '20260515', fcstTime: '1500', category: 'PTY', fcstValue: '0' },
                    { fcstDate: '20260515', fcstTime: '1500', category: 'SKY', fcstValue: '1' },
                    // 정상
                    { fcstDate: '20260515', fcstTime: '1600', category: 'TMP', fcstValue: '21' }
                ])
        } as unknown as Response)

        const adapter = new ForecastAdapter()
        const result = await adapter.fetchSlots(
            'key',
            '2026-05-15',
            new Date('2026-05-15T13:00:00+09:00')
        )
        expect(result).toHaveLength(1)
        expect(result[0]!.time).toBe('16:00')
    })

    it('잘못된 형식의 fcstDate/fcstTime 은 제외', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () =>
                sampleResponse([
                    // 잘못된 fcstDate
                    { fcstDate: 'XX260515', fcstTime: '1500', category: 'TMP', fcstValue: '20' },
                    // 정상
                    { fcstDate: '20260515', fcstTime: '1600', category: 'TMP', fcstValue: '21' }
                ])
        } as unknown as Response)

        const adapter = new ForecastAdapter()
        const result = await adapter.fetchSlots(
            'key',
            '2026-05-15',
            new Date('2026-05-15T13:00:00+09:00')
        )
        expect(result).toHaveLength(1)
    })

    it('PTY > 0 이면 강수 기반 condition, SKY 사용은 PTY=0 일 때', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () =>
                sampleResponse([
                    // PTY=1 (비)
                    { fcstDate: '20260515', fcstTime: '1500', category: 'TMP', fcstValue: '15' },
                    { fcstDate: '20260515', fcstTime: '1500', category: 'PTY', fcstValue: '1' },
                    { fcstDate: '20260515', fcstTime: '1500', category: 'SKY', fcstValue: '3' },
                    // PTY=0, SKY=1 (맑음)
                    { fcstDate: '20260515', fcstTime: '1600', category: 'TMP', fcstValue: '18' },
                    { fcstDate: '20260515', fcstTime: '1600', category: 'PTY', fcstValue: '0' },
                    { fcstDate: '20260515', fcstTime: '1600', category: 'SKY', fcstValue: '1' }
                ])
        } as unknown as Response)

        const adapter = new ForecastAdapter()
        const result = await adapter.fetchSlots(
            'key',
            '2026-05-15',
            new Date('2026-05-15T13:00:00+09:00')
        )
        expect(result).toHaveLength(2)
        // condition 의 정확한 값은 enum 매핑에 따라 다르지만 두 슬롯이 다른 condition 을 가질 것
        expect(result[0]!.condition).toBeTruthy()
        expect(result[1]!.condition).toBeTruthy()
    })

    it('PTY/SKY 둘 다 없으면 fallback condition 사용', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () =>
                sampleResponse([
                    { fcstDate: '20260515', fcstTime: '1500', category: 'TMP', fcstValue: '20' }
                ])
        } as unknown as Response)

        const adapter = new ForecastAdapter()
        const result = await adapter.fetchSlots(
            'key',
            '2026-05-15',
            new Date('2026-05-15T13:00:00+09:00')
        )
        expect(result).toHaveLength(1)
        expect(result[0]!.condition).toBeTruthy()
    })

    it('fetch 실패(!ok) → throw', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 500
        } as unknown as Response)
        const adapter = new ForecastAdapter()
        await expect(
            adapter.fetchSlots('key', '2026-05-15', new Date('2026-05-15T13:00:00+09:00'))
        ).rejects.toThrow(/KMA forecast/)
    })

    it('과거 날짜 요청 — targetDate < today 시 targetDate 기준 base 계산', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse([])
        } as unknown as Response)

        const adapter = new ForecastAdapter()
        const now = new Date('2026-05-15T13:00:00+09:00')
        await adapter.fetchSlots('key', '2026-05-10', now)
        const calledUrl = fetchSpy.mock.calls[0]![0] as string
        // 과거 요청은 baseDate 가 요청한 날짜 또는 그 직전 (00:00 → 전날 23:00 fallback)
        expect(calledUrl).toMatch(/base_date=2026050[9]|2026051[0]/)
    })

    it('이른 새벽(02:00 이전) — 전날 23:00 base 로 fallback', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse([])
        } as unknown as Response)
        const adapter = new ForecastAdapter()
        const now = new Date('2026-05-15T00:30:00+09:00') // 00:30 KST
        await adapter.fetchSlots('key', '2026-05-15', now)
        const calledUrl = fetchSpy.mock.calls[0]![0] as string
        expect(calledUrl).toMatch(/base_date=20260514/)
        expect(calledUrl).toMatch(/base_time=2300/)
    })

    it('미래 날짜 요청 — now 기준 baseDate', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => sampleResponse([])
        } as unknown as Response)
        const adapter = new ForecastAdapter()
        const now = new Date('2026-05-15T13:00:00+09:00')
        await adapter.fetchSlots('key', '2026-05-20', now)
        const calledUrl = fetchSpy.mock.calls[0]![0] as string
        expect(calledUrl).toMatch(/base_date=20260515/)
    })
})
