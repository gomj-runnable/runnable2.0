import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[routeId].post'

const { getRouteById, forkRoute, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    forkRoute: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, forkRoute }
}))
vi.mock('../../../../utils/session', () => ({
    requireSession
}))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('POST /api/routes/fork/[routeId]', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        forkRoute.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('비공개 경로는 포크 불가 (403)', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: false })

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('공개 경로면 forkRoute(routeId, userId) 위임', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: true })
        const forked = { routeId: 'forked-1' }
        forkRoute.mockResolvedValue(forked)

        const result = await handler(makeEvent('r-1'))

        expect(forkRoute).toHaveBeenCalledWith('r-1', 'me')
        expect(result).toBe(forked)
    })
})
