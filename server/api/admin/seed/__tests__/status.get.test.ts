import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../status.get'

const { requireSession } = vi.hoisted(() => ({ requireSession: vi.fn() }))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))
vi.mock('../../../../utils/config', () => ({ dbMode: 'pglite' }))

describe('GET /api/admin/seed/status', () => {
    beforeEach(() => {
        requireSession.mockReset().mockResolvedValue({ userId: 'admin-1', role: 50 })
    })

    it('관리자는 dbMode 반환', async () => {
        const result = await handler({ context: {} } as any)

        expect(result).toEqual({ dbMode: 'pglite' })
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 403 })
    })
})
