import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { findAll } = vi.hoisted(() => ({ findAll: vi.fn() }))
vi.mock('../../../repositories', () => ({
    getFacilityRepository: vi.fn(async () => ({ findAll }))
}))

describe('GET /api/facilities', () => {
    beforeEach(() => {
        findAll.mockReset()
    })

    it('repository.findAll() 결과를 그대로 반환한다', async () => {
        const fixture = [{ id: 'f1' }, { id: 'f2' }]
        findAll.mockResolvedValue(fixture)

        const result = await handler({} as any)

        expect(findAll).toHaveBeenCalledOnce()
        expect(result).toBe(fixture)
    })
})
