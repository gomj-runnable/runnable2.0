import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../active.get'

const { listActiveCollections } = vi.hoisted(() => ({ listActiveCollections: vi.fn() }))
vi.mock('../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ listActiveCollections }))
}))

describe('GET /api/curation/active', () => {
    beforeEach(() => {
        listActiveCollections.mockReset()
    })

    it('오늘 날짜 (YYYY-MM-DD) 로 listActiveCollections 를 호출한다', async () => {
        const fixture = [{ collectionId: 'c-1' }]
        listActiveCollections.mockResolvedValue(fixture)

        const result = await handler({} as any)

        expect(listActiveCollections).toHaveBeenCalledTimes(1)
        const [arg] = listActiveCollections.mock.calls[0]!
        expect(arg).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(result).toBe(fixture)
    })
})
