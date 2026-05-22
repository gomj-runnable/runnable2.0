import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../routes.post'

const { addRoute, requireSession } = vi.hoisted(() => ({
    addRoute: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../repositories', () => ({
    getCurationRepository: vi.fn(async () => ({ addRoute }))
}))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

const validBody = {
    routeId: 'r-1',
    sortOrder: 0
}

const makeEvent = (collectionId: string | undefined, body: any) =>
    ({
        context: { params: { collectionId } },
        body,
        method: 'POST',
        path: '/api/curation/c-1/routes'
    }) as any

describe('POST /api/curation/[collectionId]/routes', () => {
    beforeEach(() => {
        addRoute.mockReset()
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
    })

    it('collectionId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined, validBody))).rejects.toMatchObject({
            statusCode: 400
        })
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler(makeEvent('c-1', validBody))).rejects.toMatchObject({
            statusCode: 403
        })
    })

    it('zod 위반 (sortOrder 음수) → 400', async () => {
        await expect(
            handler(makeEvent('c-1', { ...validBody, sortOrder: -1 }))
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('관리자 + 유효 body → addRoute 위임', async () => {
        const created = { routeId: 'r-1', collectionId: 'c-1' }
        addRoute.mockResolvedValue(created)

        const result = await handler(makeEvent('c-1', validBody))

        expect(addRoute).toHaveBeenCalledWith('c-1', expect.objectContaining(validBody))
        expect(result).toBe(created)
    })
})
