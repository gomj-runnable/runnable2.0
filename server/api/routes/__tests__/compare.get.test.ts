import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../compare.get'

const { getRouteById, getSectionsByRouteId, computeMeta, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    getSectionsByRouteId: vi.fn(),
    computeMeta: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../services/route.service', () => ({
    routeService: { getRouteById, getSectionsByRouteId }
}))
vi.mock('../../../services/route-compare.service', () => ({
    routeCompareService: { computeMeta }
}))
vi.mock('../../../security/auth/service', () => ({
    auth: { requireSession }
}))

const makeEvent = (query: Record<string, string> = {}) =>
    ({ method: 'GET', path: '/api/routes/compare', context: {}, query }) as any

const publicRoute = (id: string, userId = 'owner-1') => ({
    routeId: id,
    userId,
    isPublic: true,
    title: `route ${id}`
})

describe('GET /api/routes/compare', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        getSectionsByRouteId.mockReset().mockResolvedValue([])
        computeMeta.mockReset().mockResolvedValue({ distance: 0 })
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('두 경로가 공개라면 양쪽 itemA/itemB 를 반환한다', async () => {
        getRouteById.mockImplementation(async (id: string) => publicRoute(id))

        const result = await handler(makeEvent({ routeA: 'r-a', routeB: 'r-b' }))

        expect(result.routeA.route.routeId).toBe('r-a')
        expect(result.routeB.route.routeId).toBe('r-b')
        expect(getSectionsByRouteId).toHaveBeenCalledWith('r-a')
        expect(getSectionsByRouteId).toHaveBeenCalledWith('r-b')
        expect(computeMeta).toHaveBeenCalledWith('r-a')
        expect(computeMeta).toHaveBeenCalledWith('r-b')
    })

    it('routeA / routeB 쿼리 누락 시 400', async () => {
        await expect(handler(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('경로가 존재하지 않으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(
            handler(makeEvent({ routeA: 'missing', routeB: 'r-b' }))
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('비공개 경로면서 본인 소유가 아니면 403', async () => {
        getRouteById.mockImplementation(async (id: string) => ({
            routeId: id,
            userId: 'other',
            isPublic: false,
            title: id
        }))

        await expect(handler(makeEvent({ routeA: 'r-a', routeB: 'r-b' }))).rejects.toMatchObject({
            statusCode: 403
        })
    })

    it('비공개 경로라도 본인 소유면 통과', async () => {
        getRouteById.mockImplementation(async (id: string) => ({
            routeId: id,
            userId: 'me',
            isPublic: false,
            title: id
        }))

        const result = await handler(makeEvent({ routeA: 'r-a', routeB: 'r-b' }))

        expect(result.routeA.route.routeId).toBe('r-a')
        expect(result.routeB.route.routeId).toBe('r-b')
    })

    it('세션이 없으면 401', async () => {
        requireSession.mockRejectedValue(
            Object.assign(new Error('Unauthorized'), { statusCode: 401 })
        )

        await expect(handler(makeEvent({ routeA: 'r-a', routeB: 'r-b' }))).rejects.toMatchObject({
            statusCode: 401
        })
    })
})
