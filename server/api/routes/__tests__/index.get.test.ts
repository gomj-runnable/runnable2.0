import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { listRoutesByUser, searchPublicRoutes, getSessionUser } = vi.hoisted(() => ({
    listRoutesByUser: vi.fn(),
    searchPublicRoutes: vi.fn(),
    getSessionUser: vi.fn()
}))
vi.mock('../../../services/route.service', () => ({
    routeService: { listRoutesByUser, searchPublicRoutes }
}))
vi.mock('../../../http/session', () => ({ getSessionUser }))

describe('GET /api/routes', () => {
    beforeEach(() => {
        listRoutesByUser.mockReset()
        searchPublicRoutes.mockReset()
        getSessionUser.mockReset()
    })

    it('세션이 있으면 listRoutesByUser(userId) 를 반환한다', async () => {
        getSessionUser.mockResolvedValue({ userId: 'u-1' })
        const fixture = [{ routeId: 'r-1' }]
        listRoutesByUser.mockResolvedValue(fixture)

        const result = await handler({} as any)

        expect(listRoutesByUser).toHaveBeenCalledWith('u-1')
        expect(searchPublicRoutes).not.toHaveBeenCalled()
        expect(result).toBe(fixture)
    })

    it('세션이 없으면 searchPublicRoutes() 결과를 반환한다', async () => {
        getSessionUser.mockResolvedValue(null)
        const fixture = [{ routeId: 'public-1' }]
        searchPublicRoutes.mockResolvedValue(fixture)

        const result = await handler({} as any)

        expect(searchPublicRoutes).toHaveBeenCalledWith()
        expect(listRoutesByUser).not.toHaveBeenCalled()
        expect(result).toBe(fixture)
    })
})
