import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObservedWeatherAdapter } from '../observed.adapter'

// KMA TYP01 응답은 공백/콤마 구분 텍스트 표.
// 헤더는 #YYMMDDHHMI STN TA 같은 형식이고 데이터 행은 콤마 또는 공백 구분.
const sampleTaText = `#START#
#  YYMMDDHHMI STN TA
202605151400, 108, 21.5
202605151500, 108, 22.0
#END#
`

const sampleRnText = `#START#
#  YYMMDDHHMI STN RN
202605151400, 108, 0.0
202605151500, 108, 1.2
#END#
`

const sampleCloudText = `#START#
#  YYMMDDHHMI STN CA_TOT
202605151400, 108, 3
202605151500, 108, 7
#END#
`

const samplePm10Text = `#START#
#  TM STN PM10
202605151400, 108, 30
202605151500, 108, 45
#END#
`

const textResponse = (text: string) =>
    ({
        ok: true,
        arrayBuffer: async () => Buffer.from(text, 'utf-8')
    }) as unknown as Response

describe('ObservedWeatherAdapter.fetchSlots()', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('TA/RN/CA_TOT/PM10 그룹화 후 정렬된 hourly slots 반환', async () => {
        // fetch 호출 4회 (TA, RN, CA_TOT, PM10) — URL 로 분기
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            const urlStr = String(url)
            if (urlStr.includes('obs=TA')) return textResponse(sampleTaText)
            if (urlStr.includes('obs=RN')) return textResponse(sampleRnText)
            if (urlStr.includes('obs=CA_TOT')) return textResponse(sampleCloudText)
            if (urlStr.includes('dst_pm10_tm')) return textResponse(samplePm10Text)
            return { ok: false, status: 404 } as unknown as Response
        })

        const adapter = new ObservedWeatherAdapter()
        const start = new Date('2026-05-15T14:00:00+09:00')
        const end = new Date('2026-05-15T15:00:00+09:00')
        const slots = await adapter.fetchSlots('key', start, end)

        expect(slots.length).toBeGreaterThanOrEqual(2)
        const slot0 = slots[0]!
        expect(slot0.source).toBe('observed')
        expect(slot0.temperature).toBeCloseTo(21.5, 1)
        expect(slot0.pm10).toBe(30)
        expect(slot0.pm10Grade).toBeTruthy()
    })

    it('TA 가 없는 timestamp 는 건너뜀', async () => {
        // RN/CLOUD/PM10 만 있는 시점은 결과에 포함 안 됨
        const partialTaText = `#START#
#  YYMMDDHHMI STN TA
202605151500, 108, 22.0
#END#
`
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            const urlStr = String(url)
            if (urlStr.includes('obs=TA')) return textResponse(partialTaText)
            if (urlStr.includes('obs=RN')) return textResponse(sampleRnText)
            if (urlStr.includes('obs=CA_TOT')) return textResponse(sampleCloudText)
            return textResponse('')
        })

        const adapter = new ObservedWeatherAdapter()
        const slots = await adapter.fetchSlots(
            'key',
            new Date('2026-05-15T14:00:00+09:00'),
            new Date('2026-05-15T15:00:00+09:00')
        )
        expect(slots.length).toBe(1)
        expect(slots[0]!.temperature).toBeCloseTo(22.0, 1)
    })

    it('PM10 fetch 실패 시 PM10 없이 진행 (catch → 빈 Map)', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            const urlStr = String(url)
            if (urlStr.includes('obs=TA')) return textResponse(sampleTaText)
            if (urlStr.includes('obs=RN')) return textResponse(sampleRnText)
            if (urlStr.includes('obs=CA_TOT')) return textResponse(sampleCloudText)
            // PM10 fetch 실패
            if (urlStr.includes('dst_pm10_tm')) {
                return { ok: false, status: 500 } as unknown as Response
            }
            return textResponse('')
        })

        const adapter = new ObservedWeatherAdapter()
        const slots = await adapter.fetchSlots(
            'key',
            new Date('2026-05-15T14:00:00+09:00'),
            new Date('2026-05-15T15:00:00+09:00')
        )
        expect(slots.length).toBeGreaterThanOrEqual(2)
        expect(slots[0]!.pm10).toBeNull()
        expect(slots[0]!.pm10Grade).toBeNull()
    })

    it('TA fetch !ok 이면 throw', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 500
        } as unknown as Response)
        const adapter = new ObservedWeatherAdapter()
        await expect(
            adapter.fetchSlots(
                'key',
                new Date('2026-05-15T14:00:00+09:00'),
                new Date('2026-05-15T15:00:00+09:00')
            )
        ).rejects.toThrow(/KMA typ01/)
    })

    it('헤더 없는 응답은 빈 결과', async () => {
        const emptyText = `#START#
some random text
#END#
`
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(textResponse(emptyText))
        const adapter = new ObservedWeatherAdapter()
        const slots = await adapter.fetchSlots(
            'key',
            new Date('2026-05-15T14:00:00+09:00'),
            new Date('2026-05-15T15:00:00+09:00')
        )
        expect(slots).toEqual([])
    })

    it('YYMMDDHHMI → TM 별칭 매핑 (apihub 신규 포맷)', async () => {
        // 같은 형식이지만 헤더가 YYMMDDHHMI 인 경우
        const v2Text = `#START#
#  YYMMDDHHMI STN TA
202605151400, 108, 19.5
#END#
`
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            const urlStr = String(url)
            if (urlStr.includes('obs=TA')) return textResponse(v2Text)
            if (urlStr.includes('obs=RN')) return textResponse('')
            if (urlStr.includes('obs=CA_TOT')) return textResponse('')
            return textResponse('')
        })

        const adapter = new ObservedWeatherAdapter()
        const slots = await adapter.fetchSlots(
            'key',
            new Date('2026-05-15T14:00:00+09:00'),
            new Date('2026-05-15T14:00:00+09:00')
        )
        expect(slots).toHaveLength(1)
        expect(slots[0]!.temperature).toBeCloseTo(19.5, 1)
    })

    it('짧은 TM (10자 미만) 행은 무시', async () => {
        const shortTm = `#START#
#  YYMMDDHHMI STN TA
12345, 108, 19.5
202605151400, 108, 22.0
#END#
`
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            const urlStr = String(url)
            if (urlStr.includes('obs=TA')) return textResponse(shortTm)
            return textResponse('')
        })

        const adapter = new ObservedWeatherAdapter()
        const slots = await adapter.fetchSlots(
            'key',
            new Date('2026-05-15T14:00:00+09:00'),
            new Date('2026-05-15T14:00:00+09:00')
        )
        expect(slots).toHaveLength(1)
    })
})
