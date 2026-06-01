import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { getRouteById, findByRouteId, getSessionUser } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    findByRouteId: vi.fn(),
    getSessionUser: vi.fn()
}))
vi.mock('../../../../../services/route.service', () => ({
    routeService: { getRouteById }
}))
vi.mock('../../../../../repositories', () => ({
    getRouteInfoRepository: vi.fn(async () => ({ findByRouteId }))
}))
vi.mock('../../../../../http/session', () => ({ getSessionUser }))

const makeEvent = (routeId?: string) => ({ context: { params: { routeId } } }) as any

describe('GET /api/routes/[routeId]/feedbacks', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        findByRouteId.mockReset()
        getSessionUser.mockReset()
    })

    it('routeId 누락 시 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('공개 경로면 비로그인도 routeInfos 조회 가능', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'someone', isPublic: true })
        const items = [{ routeInfoId: 'ri-1' }]
        findByRouteId.mockResolvedValue(items)

        const result = await handler(makeEvent('r-1'))

        expect(getSessionUser).not.toHaveBeenCalled()
        expect(findByRouteId).toHaveBeenCalledWith('r-1')
        expect(result).toBe(items)
    })

    it('비공개 경로 + 비로그인 → 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'owner', isPublic: false })
        getSessionUser.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('비공개 경로 + 다른 사용자 로그인 → 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'owner', isPublic: false })
        getSessionUser.mockResolvedValue({ userId: 'stranger' })

        await expect(handler(makeEvent('r-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('비공개 경로 + 본인 → 조회 통과', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: false })
        getSessionUser.mockResolvedValue({ userId: 'me' })
        findByRouteId.mockResolvedValue([])

        const result = await handler(makeEvent('r-1'))

        expect(result).toEqual([])
    })
})
