import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { listAllCollections, requireSession } = vi.hoisted(() => ({
    listAllCollections: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ listAllCollections }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

describe('GET /api/curation', () => {
    beforeEach(() => {
        listAllCollections.mockReset()
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
    })

    it('관리자는 전체 컬렉션 목록을 받는다', async () => {
        const fixture = [{ collectionId: 'c-1' }]
        listAllCollections.mockResolvedValue(fixture)

        const result = await handler({ context: {} } as any)

        expect(result).toBe(fixture)
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 403 })
        expect(listAllCollections).not.toHaveBeenCalled()
    })
})
