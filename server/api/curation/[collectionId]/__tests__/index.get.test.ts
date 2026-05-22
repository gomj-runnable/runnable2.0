import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { getCollection } = vi.hoisted(() => ({ getCollection: vi.fn() }))
vi.mock('../../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ getCollection }))
}))

const makeEvent = (collectionId?: string) => ({ context: { params: { collectionId } } }) as any

describe('GET /api/curation/[collectionId]', () => {
    beforeEach(() => {
        getCollection.mockReset()
    })

    it('collectionId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('컬렉션 없으면 404', async () => {
        getCollection.mockResolvedValue(null)

        await expect(handler(makeEvent('c-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('컬렉션 있으면 반환', async () => {
        const collection = { collectionId: 'c-1', title: 'test' }
        getCollection.mockResolvedValue(collection)

        const result = await handler(makeEvent('c-1'))

        expect(result).toBe(collection)
    })
})
