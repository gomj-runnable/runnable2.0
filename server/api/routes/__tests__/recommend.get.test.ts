import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../recommend.get'
import { formatDate, formatHour } from '../../../services/weather/common'

const { requestByDate, searchPublicRoutes, resolveWeatherKeys } = vi.hoisted(() => ({
    requestByDate: vi.fn(),
    searchPublicRoutes: vi.fn(),
    resolveWeatherKeys: vi.fn(() => ({ authKey: 'A', openDataKey: 'O', airKoreaKey: 'K' }))
}))
vi.mock('../../../services/weather/weather.service', () => ({
    weatherService: { requestByDate }
}))
vi.mock('../../../services/route.service', () => ({
    routeService: { searchPublicRoutes }
}))
vi.mock('../../../services/weather/event', () => ({ resolveWeatherKeys }))

const makeEvent = (query: Record<string, string> = {}) => ({ query }) as any

const route = (overrides: Record<string, any> = {}) => ({
    routeId: 'r-1',
    title: 't',
    distance: 5000,
    highHeight: 100,
    lowHeight: 50,
    ...overrides
})

describe('GET /api/routes/recommend', () => {
    beforeEach(() => {
        requestByDate.mockReset()
        searchPublicRoutes.mockReset()
        resolveWeatherKeys.mockClear()
    })

    it('limit=5 가 기본, 최대 20 으로 클램프', async () => {
        const fixture = Array.from({ length: 30 }, (_, i) => route({ routeId: `r${i}` }))
        searchPublicRoutes.mockResolvedValue(fixture)
        requestByDate.mockResolvedValue(null)

        const result = await handler(makeEvent({}))
        expect(result).toHaveLength(5)

        const result2 = await handler(makeEvent({ limit: '50' }))
        expect(result2).toHaveLength(20)
    })

    it('날씨 fetch 실패 시 fallback weather (20°, 비없음) 로 진행', async () => {
        requestByDate.mockRejectedValue(new Error('weather down'))
        searchPublicRoutes.mockResolvedValue([route()])

        const result = await handler(makeEvent({ limit: '1' }))

        expect(result).toHaveLength(1)
        expect(typeof result[0].score).toBe('number')
        expect(result[0].score).toBeGreaterThan(0)
    })

    it('경로 fetch 실패 시 빈 배열', async () => {
        requestByDate.mockResolvedValue(null)
        searchPublicRoutes.mockRejectedValue(new Error('db down'))

        const result = await handler(makeEvent({}))

        expect(result).toEqual([])
    })

    it('score 가 높은 순으로 정렬', async () => {
        requestByDate.mockResolvedValue(null)
        searchPublicRoutes.mockResolvedValue([
            route({ routeId: 'mountain', distance: 30000, highHeight: 800, lowHeight: 50 }),
            route({ routeId: 'easy', distance: 3000, highHeight: 60, lowHeight: 50 })
        ])

        const result = await handler(makeEvent({}))

        expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
    })

    it('완벽한 날씨 + elevation 큰 경로 → #달리기좋은날 / #전망맛집 태그', async () => {
        requestByDate.mockResolvedValue({ dongs: [] }) // fallback weather (20°, 0 비) 그대로 사용
        searchPublicRoutes.mockResolvedValue([
            route({ routeId: 'view', distance: 5000, highHeight: 200, lowHeight: 50 })
        ])

        const result = await handler(makeEvent({ limit: '1' }))

        expect(result[0].tags).toContain('#달리기좋은날')
        expect(result[0].tags).toContain('#전망맛집')
    })

    it('현재 시각 슬롯과 매칭되는 dong hourly 데이터가 있으면 그 값으로 점수 계산', async () => {
        const now = new Date()
        const todayStr = formatDate(now)
        const hourStr = formatHour(now)

        requestByDate.mockResolvedValue({
            dongs: [
                {
                    hourly: [{ date: todayStr, time: hourStr, temperature: 35, condition: 'rainy' }]
                }
            ]
        })
        searchPublicRoutes.mockResolvedValue([
            route({ routeId: 'hot-rainy', distance: 3000, highHeight: 60, lowHeight: 50 })
        ])

        const result = await handler(makeEvent({}))

        // 35° hot + rainy + 단거리 → #더위주의, #비올때도OK, #단거리추천
        expect(result[0].tags).toEqual(expect.arrayContaining(['#더위주의']))
        expect(result[0].tags).toEqual(expect.arrayContaining(['#비올때도OK']))
    })
})
