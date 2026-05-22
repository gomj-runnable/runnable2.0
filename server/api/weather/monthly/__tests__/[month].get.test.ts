import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[month].get'

const { requestByMonth, resolveWeatherKeys, parseSources } = vi.hoisted(() => ({
    requestByMonth: vi.fn(),
    resolveWeatherKeys: vi.fn(() => ({ authKey: 'A', openDataKey: 'O', airKoreaKey: 'K' })),
    parseSources: vi.fn((raw?: string) =>
        raw ? raw.split(',') : ['observed', 'forecast', 'airquality']
    )
}))

vi.mock('../../../../services/weather/weather.service', () => ({
    weatherService: { requestByMonth }
}))
vi.mock('../../../../services/weather/event', () => ({ resolveWeatherKeys, parseSources }))

const makeEvent = (month?: string, sources?: string) =>
    ({ context: { params: { month } }, query: sources !== undefined ? { sources } : {} }) as any

describe('GET /api/weather/monthly/[month]', () => {
    beforeEach(() => {
        requestByMonth.mockReset()
        resolveWeatherKeys.mockClear()
        parseSources.mockClear()
    })

    it('YYYY-MM 이면 weatherService.requestByMonth 결과를 반환한다', async () => {
        const fixture = { observed: [{ date: '2026-05-01' }] }
        requestByMonth.mockResolvedValue(fixture)

        const result = await handler(makeEvent('2026-05'))

        expect(parseSources).toHaveBeenCalledWith(undefined)
        expect(requestByMonth).toHaveBeenCalledWith('2026-05', {
            authKey: 'A',
            openDataKey: 'O',
            airKoreaKey: 'K',
            sources: ['observed', 'forecast', 'airquality']
        })
        expect(result).toBe(fixture)
    })

    it('sources 쿼리 → parseSources 결과를 그대로 service 에 전달', async () => {
        requestByMonth.mockResolvedValue({})

        await handler(makeEvent('2026-05', 'airquality'))

        expect(parseSources).toHaveBeenCalledWith('airquality')
        expect(requestByMonth).toHaveBeenCalledWith(
            '2026-05',
            expect.objectContaining({ sources: ['airquality'] })
        )
    })

    it.each([
        ['month 누락', undefined],
        ['형식 어긋남', '2026-13-1'],
        ['빈 문자열', '']
    ])('%s → 400', async (_label, value) => {
        await expect(handler(makeEvent(value as any))).rejects.toMatchObject({ statusCode: 400 })
        expect(requestByMonth).not.toHaveBeenCalled()
    })
})
