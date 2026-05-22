import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { listSegmentsByRoute, listSegmentsByOwner, listPublicSegments, getSessionUser } = vi.hoisted(
    () => ({
        listSegmentsByRoute: vi.fn(),
        listSegmentsByOwner: vi.fn(),
        listPublicSegments: vi.fn(),
        getSessionUser: vi.fn()
    })
)
vi.mock('../../../repositories', () => ({
    getSegmentRepository: vi.fn(async () => ({
        listSegmentsByRoute,
        listSegmentsByOwner,
        listPublicSegments
    }))
}))
vi.mock('../../../utils/session', () => ({ getSessionUser }))

const makeEvent = (query: Record<string, string | boolean> = {}) => ({ query }) as any

describe('GET /api/segments', () => {
    beforeEach(() => {
        listSegmentsByRoute.mockReset()
        listSegmentsByOwner.mockReset()
        listPublicSegments.mockReset()
        getSessionUser.mockReset()
    })

    it('routeId 쿼리 → listSegmentsByRoute', async () => {
        const fixture = [{ segmentId: 's-1' }]
        listSegmentsByRoute.mockResolvedValue(fixture)

        const result = await handler(makeEvent({ routeId: 'r-1' }))

        expect(listSegmentsByRoute).toHaveBeenCalledWith('r-1')
        expect(result).toBe(fixture)
    })

    it('mine=true + 로그인 → listSegmentsByOwner', async () => {
        getSessionUser.mockResolvedValue({ userId: 'me' })
        const fixture = [{ segmentId: 'my' }]
        listSegmentsByOwner.mockResolvedValue(fixture)

        const result = await handler(makeEvent({ mine: 'true' }))

        expect(listSegmentsByOwner).toHaveBeenCalledWith('me')
        expect(result).toBe(fixture)
    })

    it('mine=true + 비로그인 → public 으로 fallback', async () => {
        getSessionUser.mockResolvedValue(null)
        listPublicSegments.mockResolvedValue([])

        await handler(makeEvent({ mine: 'true' }))

        expect(listPublicSegments).toHaveBeenCalled()
        expect(listSegmentsByOwner).not.toHaveBeenCalled()
    })

    it('쿼리 없으면 listPublicSegments', async () => {
        getSessionUser.mockResolvedValue(null)
        listPublicSegments.mockResolvedValue([])

        await handler(makeEvent({}))

        expect(listPublicSegments).toHaveBeenCalled()
    })
})
