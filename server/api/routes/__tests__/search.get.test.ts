import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../search.get'

const { searchPublicRoutes } = vi.hoisted(() => ({ searchPublicRoutes: vi.fn() }))
vi.mock('../../../services/route.service', () => ({
    routeService: { searchPublicRoutes }
}))

const makeEvent = (query: Record<string, string> = {}) => ({ query }) as any

describe('GET /api/routes/search', () => {
    beforeEach(() => {
        searchPublicRoutes.mockReset()
    })

    it('q 가 없으면 undefined 로 호출한다', async () => {
        const fixture = [{ routeId: 'r1' }]
        searchPublicRoutes.mockResolvedValue(fixture)

        const result = await handler(makeEvent())

        expect(searchPublicRoutes).toHaveBeenCalledWith(undefined)
        expect(result).toBe(fixture)
    })

    it('q 가 있으면 그 값으로 호출한다', async () => {
        searchPublicRoutes.mockResolvedValue([])

        await handler(makeEvent({ q: '한강' }))

        expect(searchPublicRoutes).toHaveBeenCalledWith('한강')
    })

    it('q 가 200자 초과면 400', async () => {
        await expect(handler(makeEvent({ q: 'a'.repeat(201) }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(searchPublicRoutes).not.toHaveBeenCalled()
    })
})
