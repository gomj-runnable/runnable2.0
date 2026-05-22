import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.delete'

const { getRouteById, deleteRoute, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    deleteRoute: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, deleteRoute }
}))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('DELETE /api/routes/[routeId]', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        deleteRoute.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('routeId 누락 시 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('경로가 없으면 404 (requireRouteOwnership)', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 404 })
        expect(deleteRoute).not.toHaveBeenCalled()
    })

    it('소유자가 다르면 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other' })

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
        expect(deleteRoute).not.toHaveBeenCalled()
    })

    it('소유자면 deleteRoute 후 success', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me' })
        deleteRoute.mockResolvedValue(undefined)

        const result = await handler(makeEvent('r-1'))

        expect(deleteRoute).toHaveBeenCalledWith('r-1')
        expect(result).toEqual({ success: true })
    })
})
