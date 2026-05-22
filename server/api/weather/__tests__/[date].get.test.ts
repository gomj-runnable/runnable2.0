import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[date].get'

const { requestByDate, resolveWeatherKeys } = vi.hoisted(() => ({
    requestByDate: vi.fn(),
    resolveWeatherKeys: vi.fn(() => ({ authKey: 'A', openDataKey: 'O', airKoreaKey: 'K' }))
}))

vi.mock('../../../services/weather/weather.service', () => ({
    weatherService: { requestByDate }
}))
vi.mock('../../../services/weather/event', () => ({ resolveWeatherKeys }))

const makeEvent = (date?: string) => ({ context: { params: { date } } }) as any

describe('GET /api/weather/[date]', () => {
    beforeEach(() => {
        requestByDate.mockReset()
        resolveWeatherKeys.mockClear()
    })

    it('YYYY-MM-DD 형식이면 weatherService.requestByDate 결과를 반환한다', async () => {
        const fixture = { observed: [], forecast: [], airquality: [] }
        requestByDate.mockResolvedValue(fixture)

        const event = makeEvent('2026-05-22')
        const result = await handler(event)

        expect(resolveWeatherKeys).toHaveBeenCalledWith(event)
        expect(requestByDate).toHaveBeenCalledWith('2026-05-22', {
            authKey: 'A',
            openDataKey: 'O',
            airKoreaKey: 'K'
        })
        expect(result).toBe(fixture)
    })

    it.each([
        ['date 누락', undefined],
        ['형식 어긋남 (slash)', '2026/05/22'],
        ['월 두 자리 아님', '2026-5-22'],
        ['추가 문자', '2026-05-22abc']
    ])('%s → 400', async (_label, value) => {
        await expect(handler(makeEvent(value as any))).rejects.toMatchObject({ statusCode: 400 })
        expect(requestByDate).not.toHaveBeenCalled()
    })
})
