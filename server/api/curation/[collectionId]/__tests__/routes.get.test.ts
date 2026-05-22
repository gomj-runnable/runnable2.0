import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../routes.get'

const { listRoutes } = vi.hoisted(() => ({ listRoutes: vi.fn() }))
vi.mock('../../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ listRoutes }))
}))

const makeEvent = (collectionId?: string) => ({ context: { params: { collectionId } } }) as any

describe('GET /api/curation/[collectionId]/routes', () => {
    beforeEach(() => {
        listRoutes.mockReset()
    })

    it('collectionId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('listRoutes 결과를 그대로 반환', async () => {
        const fixture = [{ routeId: 'r-1', sortOrder: 0 }]
        listRoutes.mockResolvedValue(fixture)

        const result = await handler(makeEvent('c-1'))

        expect(listRoutes).toHaveBeenCalledWith('c-1')
        expect(result).toBe(fixture)
    })
})
