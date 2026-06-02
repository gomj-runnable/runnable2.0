import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../sections.get'

const { getRouteById, getSectionsByRouteId, requireSession } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    getSectionsByRouteId: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, getSectionsByRouteId }
}))
vi.mock('../../../../security/auth/service', () => ({
    auth: { requireSession }
}))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('GET /api/routes/[routeId]/sections', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        getSectionsByRouteId.mockReset()
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

    it('공개 경로면 sections 반환', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: true })
        const sections = [{ sectionId: 's-1' }]
        getSectionsByRouteId.mockResolvedValue(sections)

        const result = await handler(makeEvent('r-1'))

        expect(getSectionsByRouteId).toHaveBeenCalledWith('r-1')
        expect(result).toBe(sections)
    })

    it('본인 비공개 경로면 sections 반환', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: false })
        getSectionsByRouteId.mockResolvedValue([])

        const result = await handler(makeEvent('r-1'))

        expect(result).toEqual([])
    })
})
