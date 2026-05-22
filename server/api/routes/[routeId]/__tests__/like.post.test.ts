import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../like.post'

const { getRouteById, likeRoute, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    likeRoute: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, likeRoute }
}))
vi.mock('../../../../utils/session', () => ({
    requireSession
}))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('POST /api/routes/[routeId]/like', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        likeRoute.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('routeId 누락 시 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('비공개 + 본인 소유 아니면 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: false })

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('공개 경로면 like 성공', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: true })
        likeRoute.mockResolvedValue(true)

        const result = await handler(makeEvent('r-1'))

        expect(likeRoute).toHaveBeenCalledWith('me', 'r-1')
        expect(result).toEqual({ success: true })
    })

    it('이미 좋아요한 경로면 409', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: true })
        likeRoute.mockResolvedValue(false)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 409 })
    })
})
