import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../stats.get'

const { listRoutesByUser, requireSession } = vi.hoisted(() => ({
    listRoutesByUser: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../services/route.service', () => ({
    routeService: { listRoutesByUser }
}))
vi.mock('../../../utils/session', () => ({ requireSession }))

describe('GET /api/routes/stats', () => {
    beforeEach(() => {
        listRoutesByUser.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'u-1' })
    })

    it('빈 경로 목록 → 0 카운트 / 0 거리 / 빈 monthlyStats', async () => {
        listRoutesByUser.mockResolvedValue([])

        const result = await handler({} as any)

        expect(result).toEqual({
            routeCount: 0,
            totalDistanceKm: 0,
            totalElevationChangeM: 0,
            monthlyStats: []
        })
    })

    it('거리/고도 합산 (음수 elevation 차이는 0 으로 클램프, km 단위로 변환)', async () => {
        listRoutesByUser.mockResolvedValue([
            { distance: 5000, highHeight: 100, lowHeight: 30, createdAt: '2026-01-15T00:00:00Z' },
            { distance: 3000, highHeight: 50, lowHeight: 50, createdAt: '2026-01-20T00:00:00Z' },
            { distance: 2500, highHeight: 10, lowHeight: 90, createdAt: '2026-02-01T00:00:00Z' }
        ])

        const result = await handler({} as any)

        expect(result.routeCount).toBe(3)
        expect(result.totalDistanceKm).toBeCloseTo(10.5, 1)
        // 70 + 0 + 0 (highHeight < lowHeight 라 음수 → 0)
        expect(result.totalElevationChangeM).toBe(70)
    })

    it('monthlyStats 는 createdAt 기반 월별 집계 + 오름차순 정렬', async () => {
        listRoutesByUser.mockResolvedValue([
            { distance: 5000, createdAt: '2026-02-10T00:00:00Z' },
            { distance: 3000, createdAt: '2026-01-05T00:00:00Z' },
            { distance: 1000, createdAt: '2026-01-25T00:00:00Z' },
            { distance: 7000, createdAt: null } // createdAt 없으면 제외
        ])

        const result = await handler({} as any)

        expect(result.monthlyStats).toEqual([
            { month: '2026-01', count: 2, totalDistanceKm: 4 },
            { month: '2026-02', count: 1, totalDistanceKm: 5 }
        ])
    })

    it('세션이 없으면 401', async () => {
        requireSession.mockRejectedValue(
            Object.assign(new Error('Unauthorized'), { statusCode: 401 })
        )

        await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
        expect(listRoutesByUser).not.toHaveBeenCalled()
    })
})
