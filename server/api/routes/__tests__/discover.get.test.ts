import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../discover.get'

const { searchPublicRoutes, isLikedByUser, getSessionUser } = vi.hoisted(() => ({
    searchPublicRoutes: vi.fn(),
    isLikedByUser: vi.fn(),
    getSessionUser: vi.fn()
}))
vi.mock('../../../services/route.service', () => ({
    routeService: { searchPublicRoutes, isLikedByUser }
}))
vi.mock('../../../utils/session', () => ({ getSessionUser }))

const makeEvent = (query: Record<string, string> = {}) =>
    ({ method: 'GET', path: '/api/routes/discover', query }) as any

const baseRoute = (overrides: Record<string, any> = {}) => ({
    routeId: 'r-1',
    title: 'route',
    distance: 1000,
    highHeight: 20,
    lowHeight: 0,
    sgg: ['종로구'],
    createdAt: '2026-05-01T00:00:00Z',
    authorName: 'A',
    viewCount: 0,
    likeCount: 0,
    ...overrides
})

describe('GET /api/routes/discover', () => {
    beforeEach(() => {
        searchPublicRoutes.mockReset()
        isLikedByUser.mockReset()
        getSessionUser.mockReset().mockResolvedValue(null)
    })

    it('district 쿼리는 sgg 배열에 정확히 포함된 경로만 통과', async () => {
        searchPublicRoutes.mockResolvedValue([
            baseRoute({ routeId: 'a', sgg: ['종로구'] }),
            baseRoute({ routeId: 'b', sgg: ['강남구'] })
        ])

        const result = await handler(makeEvent({ district: '강남구' }))

        expect(result.map((r) => r.routeId)).toEqual(['b'])
    })

    it('sortBy=distance 는 distance 내림차순', async () => {
        searchPublicRoutes.mockResolvedValue([
            baseRoute({ routeId: 'short', distance: 1000 }),
            baseRoute({ routeId: 'long', distance: 5000 })
        ])

        const result = await handler(makeEvent({ sortBy: 'distance' }))

        expect(result.map((r) => r.routeId)).toEqual(['long', 'short'])
    })

    it('sortBy=elevation 은 highHeight 내림차순', async () => {
        searchPublicRoutes.mockResolvedValue([
            baseRoute({ routeId: 'flat', highHeight: 10 }),
            baseRoute({ routeId: 'hill', highHeight: 200 })
        ])

        const result = await handler(makeEvent({ sortBy: 'elevation' }))

        expect(result.map((r) => r.routeId)).toEqual(['hill', 'flat'])
    })

    it('sortBy=popular 는 likeCount 내림차순', async () => {
        searchPublicRoutes.mockResolvedValue([
            baseRoute({ routeId: 'cold', likeCount: 0 }),
            baseRoute({ routeId: 'hot', likeCount: 99 })
        ])

        const result = await handler(makeEvent({ sortBy: 'popular' }))

        expect(result.map((r) => r.routeId)).toEqual(['hot', 'cold'])
    })

    it('기본은 createdAt 내림차순', async () => {
        searchPublicRoutes.mockResolvedValue([
            baseRoute({ routeId: 'old', createdAt: '2025-01-01T00:00:00Z' }),
            baseRoute({ routeId: 'new', createdAt: '2026-05-01T00:00:00Z' })
        ])

        const result = await handler(makeEvent())

        expect(result.map((r) => r.routeId)).toEqual(['new', 'old'])
    })

    it('limit 으로 자른다', async () => {
        const routes = Array.from({ length: 30 }, (_, i) =>
            baseRoute({
                routeId: `r${i}`,
                createdAt: `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00Z`
            })
        )
        searchPublicRoutes.mockResolvedValue(routes)

        const result = await handler(makeEvent({ limit: '3' }))

        expect(result).toHaveLength(3)
    })

    it('세션이 있으면 isLikedByUser 결과를 likedByMe 에 반영', async () => {
        getSessionUser.mockResolvedValue({ userId: 'u-1' })
        searchPublicRoutes.mockResolvedValue([
            baseRoute({ routeId: 'liked' }),
            baseRoute({ routeId: 'not-liked' })
        ])
        isLikedByUser.mockImplementation(
            async (_uid: string, routeId: string) => routeId === 'liked'
        )

        const result = await handler(makeEvent())

        const liked = result.find((r) => r.routeId === 'liked')
        const notLiked = result.find((r) => r.routeId === 'not-liked')
        expect(liked?.likedByMe).toBe(true)
        expect(notLiked?.likedByMe).toBe(false)
    })

    it('잘못된 쿼리는 400', async () => {
        await expect(handler(makeEvent({ limit: 'abc' }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(searchPublicRoutes).not.toHaveBeenCalled()
    })
})
