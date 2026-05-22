import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.delete'

const { getSegment, deleteSegment, requireSession } = vi.hoisted(() => ({
    getSegment: vi.fn(),
    deleteSegment: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../repositories', () => ({
    getSegmentRepository: vi.fn(async () => ({ getSegment, deleteSegment }))
}))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (segmentId?: string) => ({ context: { params: { segmentId } } }) as any

describe('DELETE /api/segments/[segmentId]', () => {
    beforeEach(() => {
        getSegment.mockReset()
        deleteSegment.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('segmentId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('없으면 404', async () => {
        getSegment.mockResolvedValue(null)

        await expect(handler(makeEvent('s-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('타인 세그먼트는 403', async () => {
        getSegment.mockResolvedValue({ segmentId: 's-1', ownerId: 'other' })

        await expect(handler(makeEvent('s-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('본인 세그먼트 삭제', async () => {
        getSegment.mockResolvedValue({ segmentId: 's-1', ownerId: 'me' })
        deleteSegment.mockResolvedValue(undefined)

        const result = await handler(makeEvent('s-1'))

        expect(deleteSegment).toHaveBeenCalledWith('s-1')
        expect(result).toEqual({ success: true })
    })
})
