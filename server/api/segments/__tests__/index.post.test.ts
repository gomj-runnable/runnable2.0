import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.post'

const { createSegment, requireSession } = vi.hoisted(() => ({
    createSegment: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getSegmentRepository: vi.fn(async () => ({ createSegment }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const validBody = {
    name: 'climb-1',
    routeId: 'r-1',
    startPositionIndex: 0,
    endPositionIndex: 100,
    distanceKm: 1.5
}

const makeEvent = (body: any) =>
    ({ context: {}, body, method: 'POST', path: '/api/segments' }) as any

describe('POST /api/segments', () => {
    beforeEach(() => {
        createSegment.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('유효 body → repo.createSegment(input, userId)', async () => {
        const saved = { segmentId: 's-1' }
        createSegment.mockResolvedValue(saved)

        const result = await handler(makeEvent(validBody))

        expect(createSegment).toHaveBeenCalledWith(expect.objectContaining(validBody), 'me')
        expect(result).toBe(saved)
    })

    it('200m 미만 거리는 400', async () => {
        await expect(handler(makeEvent({ ...validBody, distanceKm: 0.1 }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(createSegment).not.toHaveBeenCalled()
    })

    it('zod 위반 (name 빈 문자열) → 400', async () => {
        await expect(handler(makeEvent({ ...validBody, name: '' }))).rejects.toMatchObject({
            statusCode: 400
        })
    })

    it('세션 없으면 401', async () => {
        requireSession.mockRejectedValue(
            Object.assign(new Error('Unauthorized'), { statusCode: 401 })
        )

        await expect(handler(makeEvent(validBody))).rejects.toMatchObject({ statusCode: 401 })
    })
})
