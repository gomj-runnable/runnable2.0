import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../seoul-dong.get'

const { getEmdBoundary } = vi.hoisted(() => ({ getEmdBoundary: vi.fn() }))
vi.mock('../../../utils/district/boundary', () => ({ getEmdBoundary }))

describe('GET /api/boundary/seoul-dong', () => {
    beforeEach(() => {
        getEmdBoundary.mockReset()
    })

    it('getEmdBoundary() 결과를 그대로 반환한다', async () => {
        const fixture = { type: 'FeatureCollection', features: [{ id: 'dong-1' }] }
        getEmdBoundary.mockResolvedValue(fixture)

        const result = await handler({} as any)

        expect(result).toBe(fixture)
    })

    it('실패 시 빈 FeatureCollection 을 반환한다', async () => {
        getEmdBoundary.mockRejectedValue(new Error('boundary fetch failed'))

        const result = await handler({} as any)

        expect(result).toEqual({ type: 'FeatureCollection', features: [] })
    })
})
