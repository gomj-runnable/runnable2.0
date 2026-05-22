import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[routeId].get'

const { getRouteById, incrementViewCount, getSectionsByRouteId, findByRouteId } = vi.hoisted(
    () => ({
        getRouteById: vi.fn(),
        incrementViewCount: vi.fn(),
        getSectionsByRouteId: vi.fn(),
        findByRouteId: vi.fn()
    })
)
vi.mock('../../../../services/route.service', () => ({
    routeService: { getRouteById, incrementViewCount, getSectionsByRouteId }
}))
vi.mock('../../../../repositories', () => ({
    getRouteInfoRepository: vi.fn(async () => ({ findByRouteId }))
}))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('GET /api/routes/share/[routeId]', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        incrementViewCount.mockReset()
        getSectionsByRouteId.mockReset().mockResolvedValue([])
        findByRouteId.mockReset().mockResolvedValue([])
    })

    it('routeId 누락 시 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('비공개 경로는 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', isPublic: false })

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
        expect(incrementViewCount).not.toHaveBeenCalled()
    })

    it('공개 경로면 view count 증가 + route/sections/routeInfos 반환', async () => {
        const route = { routeId: 'r-1', isPublic: true, title: 'shared' }
        const sections = [{ sectionId: 's-1' }]
        const routeInfos = [{ routeInfoId: 'ri-1' }]
        getRouteById.mockResolvedValue(route)
        getSectionsByRouteId.mockResolvedValue(sections)
        findByRouteId.mockResolvedValue(routeInfos)

        const result = await handler(makeEvent('r-1'))

        expect(incrementViewCount).toHaveBeenCalledWith('r-1')
        expect(result).toEqual({ route, sections, routeInfos })
    })
})
