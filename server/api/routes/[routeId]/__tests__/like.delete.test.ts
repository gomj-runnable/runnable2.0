import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../like.delete'

const { getRouteById, unlikeRoute, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    unlikeRoute: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, unlikeRoute }
}))
vi.mock('../../../../utils/session', () => ({
    requireSession
}))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('DELETE /api/routes/[routeId]/like', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        unlikeRoute.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('비공개 + 본인 소유 아니면 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: false })

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('unlike 성공', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: true })
        unlikeRoute.mockResolvedValue(true)

        const result = await handler(makeEvent('r-1'))

        expect(unlikeRoute).toHaveBeenCalledWith('me', 'r-1')
        expect(result).toEqual({ success: true })
    })

    it('좋아요하지 않은 경로면 409', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: true })
        unlikeRoute.mockResolvedValue(false)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 409 })
    })
})
