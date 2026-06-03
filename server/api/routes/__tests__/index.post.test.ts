import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.post'

const { createRouteWithSections, requireSession } = vi.hoisted(() => ({
    createRouteWithSections: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../services/route.service', () => ({
    routeService: { createRouteWithSections }
}))
vi.mock('../../../security/auth/service', () => ({
    auth: { requireSession }
}))

const validRoute = {
    title: '한강 5km',
    distance: 5000,
    highHeight: 30,
    lowHeight: 10,
    isPublic: true
}

const makeEvent = (body: any) => ({ context: {}, body, method: 'POST', path: '/api/routes' }) as any

describe('POST /api/routes', () => {
    beforeEach(() => {
        createRouteWithSections.mockReset()
        requireSession.mockReset()
    })

    it('세션이 없으면 401', async () => {
        requireSession.mockRejectedValue(
            Object.assign(new Error('Unauthorized'), { statusCode: 401 })
        )

        await expect(handler(makeEvent({ route: validRoute, sections: [] }))).rejects.toMatchObject(
            {
                statusCode: 401
            }
        )
        expect(createRouteWithSections).not.toHaveBeenCalled()
    })

    it('인증 + 유효한 body 면 서비스로 위임한다', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1' })
        const created = { routeId: 'r-1', sections: [] }
        createRouteWithSections.mockResolvedValue(created)

        const sections = [{ geom: undefined, attrs: [], pois: [] }]
        const result = await handler(makeEvent({ route: validRoute, sections }))

        expect(createRouteWithSections).toHaveBeenCalledWith(
            expect.objectContaining({ title: '한강 5km' }),
            sections,
            'u-1'
        )
        expect(result).toBe(created)
    })

    it('zod 스키마 위반은 withErrorHandler 가 400 으로 변환한다', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1' })

        await expect(handler(makeEvent({ route: {}, sections: [] }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(createRouteWithSections).not.toHaveBeenCalled()
    })
})
