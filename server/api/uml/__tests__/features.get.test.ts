import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../features.get'

const { getOrDetectFeatures, requireSession } = vi.hoisted(() => ({
    getOrDetectFeatures: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../utils/uml/detect-features', () => ({ getOrDetectFeatures }))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

describe('GET /api/uml/features', () => {
    beforeEach(() => {
        getOrDetectFeatures.mockReset()
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
    })

    it('관리자는 getOrDetectFeatures() 결과 반환', async () => {
        const fixture = { features: [] }
        getOrDetectFeatures.mockResolvedValue(fixture)

        const result = await handler({ context: {} } as any)

        expect(result).toBe(fixture)
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 403 })
    })
})
