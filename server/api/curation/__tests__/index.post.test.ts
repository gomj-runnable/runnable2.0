import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.post'

const { createCollection, requireSession } = vi.hoisted(() => ({
    createCollection: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ createCollection }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

const validBody = {
    title: '봄 추천 코스',
    season: 'spring',
    theme: 'cherry-blossom',
    validFrom: '2026-03-01',
    validTo: '2026-05-31'
}

const makeEvent = (body: any) =>
    ({ context: {}, body, method: 'POST', path: '/api/curation' }) as any

describe('POST /api/curation', () => {
    beforeEach(() => {
        createCollection.mockReset()
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
    })

    it('관리자 + 유효 body → createCollection 위임', async () => {
        const saved = { collectionId: 'c-1' }
        createCollection.mockResolvedValue(saved)

        const result = await handler(makeEvent(validBody))

        expect(createCollection).toHaveBeenCalledWith(expect.objectContaining(validBody), 'admin-1')
        expect(result).toBe(saved)
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler(makeEvent(validBody))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('zod 위반 (validFrom 형식 어긋남) → 400', async () => {
        await expect(
            handler(makeEvent({ ...validBody, validFrom: '2026/03/01' }))
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(createCollection).not.toHaveBeenCalled()
    })
})
