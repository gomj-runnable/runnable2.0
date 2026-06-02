import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getSessionUser, requireSession, requireRouteOwnership } from '../session'
import { auth } from '../../security/auth/service'

vi.mock('../../security/auth/service', () => ({
    auth: {
        getSession: vi.fn(),
        requireSession: vi.fn()
    }
}))

describe('session helpers', () => {
    const event = {} as any
    const owner = { userId: 'owner-1', name: 'O', email: 'o@x', role: 1 }

    beforeEach(() => vi.clearAllMocks())

    it('getSessionUser 는 auth.getSession 위임', async () => {
        vi.mocked(auth.getSession).mockResolvedValue(owner)
        await expect(getSessionUser(event)).resolves.toBe(owner)
        expect(auth.getSession).toHaveBeenCalledWith(event)
    })

    it('requireSession 은 auth.requireSession 위임', async () => {
        vi.mocked(auth.requireSession).mockResolvedValue(owner)
        await expect(requireSession(event)).resolves.toBe(owner)
    })
})

describe('requireRouteOwnership', () => {
    const event = {} as any
    const owner = { userId: 'owner-1', name: 'O', email: 'o@x', role: 1 }

    beforeEach(() => vi.clearAllMocks())

    it('소유자 본인이면 route 반환', async () => {
        const route = { routeId: 'r1', userId: 'owner-1', title: 't' } as any
        vi.mocked(auth.requireSession).mockResolvedValue(owner)
        const getRoute = vi.fn().mockResolvedValue(route)
        await expect(requireRouteOwnership(event, 'r1', getRoute)).resolves.toBe(route)
        expect(getRoute).toHaveBeenCalledWith('r1')
    })

    it('route 가 없으면 404', async () => {
        vi.mocked(auth.requireSession).mockResolvedValue(owner)
        const getRoute = vi.fn().mockResolvedValue(null)
        await expect(requireRouteOwnership(event, 'r1', getRoute)).rejects.toMatchObject({
            statusCode: 404
        })
    })

    it('다른 사용자 소유면 403', async () => {
        vi.mocked(auth.requireSession).mockResolvedValue(owner)
        const other = { routeId: 'r1', userId: 'other-1', title: 't' } as any
        const getRoute = vi.fn().mockResolvedValue(other)
        await expect(requireRouteOwnership(event, 'r1', getRoute)).rejects.toMatchObject({
            statusCode: 403
        })
    })
})
