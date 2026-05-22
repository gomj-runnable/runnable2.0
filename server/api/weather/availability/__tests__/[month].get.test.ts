import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[month].get'

const { getAvailability, resolveWeatherKeys, parseSources } = vi.hoisted(() => ({
    getAvailability: vi.fn(),
    resolveWeatherKeys: vi.fn(() => ({ authKey: 'A', openDataKey: 'O', airKoreaKey: 'K' })),
    parseSources: vi.fn((raw?: string) =>
        raw ? raw.split(',') : ['observed', 'forecast', 'airquality']
    )
}))

vi.mock('../../../../services/weather/weather.service', () => ({
    weatherService: { getAvailability }
}))
vi.mock('../../../../services/weather/event', () => ({ resolveWeatherKeys, parseSources }))

const makeEvent = (month?: string, sources?: string) =>
    ({ context: { params: { month } }, query: sources !== undefined ? { sources } : {} }) as any

describe('GET /api/weather/availability/[month]', () => {
    beforeEach(() => {
        getAvailability.mockReset()
        resolveWeatherKeys.mockClear()
        parseSources.mockClear()
    })

    it('YYYY-MM 이면 weatherService.getAvailability 결과를 반환한다 (sources 미지정 → 전체)', async () => {
        const fixture = { '2026-05-01': { observed: true } }
        getAvailability.mockResolvedValue(fixture)

        const result = await handler(makeEvent('2026-05'))

        expect(parseSources).toHaveBeenCalledWith(undefined)
        expect(getAvailability).toHaveBeenCalledWith('2026-05', {
            authKey: 'A',
            openDataKey: 'O',
            airKoreaKey: 'K',
            sources: ['observed', 'forecast', 'airquality']
        })
        expect(result).toBe(fixture)
    })

    it('sources 쿼리는 parseSources 결과로 전달된다', async () => {
        getAvailability.mockResolvedValue({})

        await handler(makeEvent('2026-05', 'observed,forecast'))

        expect(parseSources).toHaveBeenCalledWith('observed,forecast')
        expect(getAvailability).toHaveBeenCalledWith(
            '2026-05',
            expect.objectContaining({ sources: ['observed', 'forecast'] })
        )
    })

    it.each([
        ['month 누락', undefined],
        ['형식 어긋남 (day 포함)', '2026-05-01'],
        ['월 한 자리', '2026-5']
    ])('%s → 400', async (_label, value) => {
        await expect(handler(makeEvent(value as any))).rejects.toMatchObject({ statusCode: 400 })
        expect(getAvailability).not.toHaveBeenCalled()
    })
})
