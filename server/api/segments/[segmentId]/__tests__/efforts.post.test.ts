import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../efforts.post'

const { getSegment, createEffort, requireSession } = vi.hoisted(() => ({
    getSegment: vi.fn(),
    createEffort: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../repositories', () => ({
    getSegmentRepository: vi.fn(async () => ({ getSegment, createEffort }))
}))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const validBody = {
    durationSec: 600,
    paceSecPerKm: 360
}

const makeEvent = (segmentId: string | undefined, body: any) =>
    ({
        context: { params: { segmentId } },
        body,
        method: 'POST',
        path: '/api/segments/s-1/efforts'
    }) as any

describe('POST /api/segments/[segmentId]/efforts', () => {
    beforeEach(() => {
        getSegment.mockReset()
        createEffort.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('segmentId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined, validBody))).rejects.toMatchObject({
            statusCode: 400
        })
    })

    it('비정상 페이스 (<120 sec/km) → 400', async () => {
        await expect(
            handler(makeEvent('s-1', { ...validBody, paceSecPerKm: 60 }))
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(createEffort).not.toHaveBeenCalled()
    })

    it('세그먼트 없으면 404', async () => {
        getSegment.mockResolvedValue(null)

        await expect(handler(makeEvent('s-1', validBody))).rejects.toMatchObject({
            statusCode: 404
        })
    })

    it('유효 → createEffort 위임', async () => {
        getSegment.mockResolvedValue({ segmentId: 's-1' })
        const effort = { effortId: 'e-1' }
        createEffort.mockResolvedValue(effort)

        const result = await handler(makeEvent('s-1', validBody))

        expect(createEffort).toHaveBeenCalledWith(
            expect.objectContaining({ ...validBody, segmentId: 's-1' }),
            'me'
        )
        expect(result).toBe(effort)
    })
})
