import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { getSegment } = vi.hoisted(() => ({ getSegment: vi.fn() }))
vi.mock('../../../../repositories', () => ({
    getSegmentRepository: vi.fn(async () => ({ getSegment }))
}))

const makeEvent = (segmentId?: string) => ({ context: { params: { segmentId } } }) as any

describe('GET /api/segments/[segmentId]', () => {
    beforeEach(() => {
        getSegment.mockReset()
    })

    it('segmentId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('없으면 404', async () => {
        getSegment.mockResolvedValue(null)

        await expect(handler(makeEvent('s-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('있으면 반환', async () => {
        const segment = { segmentId: 's-1', name: 'climb' }
        getSegment.mockResolvedValue(segment)

        const result = await handler(makeEvent('s-1'))

        expect(result).toBe(segment)
    })
})
