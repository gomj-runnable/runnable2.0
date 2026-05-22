import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.delete'

const { deleteCollection, requireSession } = vi.hoisted(() => ({
    deleteCollection: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ deleteCollection }))
}))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

const makeEvent = (collectionId?: string) => ({ context: { params: { collectionId } } }) as any

describe('DELETE /api/curation/[collectionId]', () => {
    beforeEach(() => {
        deleteCollection.mockReset()
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
    })

    it('collectionId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler(makeEvent('c-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('존재하지 않는 컬렉션이면 404', async () => {
        deleteCollection.mockResolvedValue(false)

        await expect(handler(makeEvent('c-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('관리자 + 삭제 성공 → success true', async () => {
        deleteCollection.mockResolvedValue(true)

        const result = await handler(makeEvent('c-1'))

        expect(deleteCollection).toHaveBeenCalledWith('c-1')
        expect(result).toEqual({ success: true })
    })
})
