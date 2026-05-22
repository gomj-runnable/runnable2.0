import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.post'

const { getRouteById, create, requireSession, nanoidMock } = vi.hoisted(() => ({
    getRouteById: vi.fn(),
    create: vi.fn(),
    requireSession: vi.fn(),
    nanoidMock: vi.fn(() => 'fixed-id')
}))
vi.mock('nanoid', () => ({ nanoid: nanoidMock }))
vi.mock('../../../../../services/route.service', () => ({
    routeService: { getRouteById }
}))
vi.mock('../../../../../repositories', () => ({
    getRouteInfoRepository: vi.fn(async () => ({ create }))
}))
vi.mock('../../../../../utils/session', () => ({ requireSession }))

const validInput = {
    name: '음수대',
    description: '시원한 물',
    lng: 127.0,
    lat: 37.5,
    elevation: 30
}

const makeEvent = (routeId: string | undefined, body: any) =>
    ({
        context: { params: { routeId } },
        body,
        method: 'POST',
        path: '/api/routes/r-1/feedbacks'
    }) as any

describe('POST /api/routes/[routeId]/feedbacks', () => {
    beforeEach(() => {
        getRouteById.mockReset()
        create.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me', name: '나' })
        nanoidMock.mockReset().mockReturnValue('fixed-id')
    })

    it('경로 없으면 404', async () => {
        getRouteById.mockResolvedValue(null)

        await expect(handler(makeEvent('r-1', validInput))).rejects.toMatchObject({
            statusCode: 404
        })
    })

    it('비공개 + 본인 아니면 403', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: false })

        await expect(handler(makeEvent('r-1', validInput))).rejects.toMatchObject({
            statusCode: 403
        })
    })

    it('공개 경로 + 유효 body → routeInfo 생성, nanoid + user 정보 주입', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'other', isPublic: true })
        create.mockImplementation(async (data) => ({ ...data, createdAt: 'now' }))

        const result = await handler(makeEvent('r-1', validInput))

        expect(create).toHaveBeenCalledWith({
            routeInfoId: 'fixed-id',
            routeId: 'r-1',
            userId: 'me',
            name: '음수대',
            description: '시원한 물',
            lng: '127',
            lat: '37.5',
            elevation: '30',
            authorName: '나'
        })
        expect(result.routeInfoId).toBe('fixed-id')
    })

    it('elevation 미지정 시 null 저장 + user.name 없으면 "익명"', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: false })
        requireSession.mockResolvedValueOnce({ userId: 'me' })
        create.mockImplementation(async (data) => data)

        const { elevation: _, ...withoutElevation } = validInput
        const result = await handler(makeEvent('r-1', withoutElevation))

        expect(result.elevation).toBeNull()
        expect(result.authorName).toBe('익명')
    })

    it('zod 위반 (name 빈 문자열) → 400', async () => {
        getRouteById.mockResolvedValue({ routeId: 'r-1', userId: 'me', isPublic: true })

        await expect(handler(makeEvent('r-1', { ...validInput, name: '' }))).rejects.toMatchObject({
            statusCode: 400
        })
    })
})
