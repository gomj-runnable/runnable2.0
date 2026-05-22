import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../rescan.post'

const { rescanFeatures, requireSession } = vi.hoisted(() => ({
    rescanFeatures: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../utils/uml/detect-features', () => ({ rescanFeatures }))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

describe('POST /api/uml/features/rescan', () => {
    beforeEach(() => {
        rescanFeatures.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'admin-1', role: 50 })
    })

    it('관리자는 rescanFeatures() 결과 반환', async () => {
        const fixture = { count: 7 }
        rescanFeatures.mockResolvedValue(fixture)

        const result = await handler({ context: {} } as any)

        expect(result).toBe(fixture)
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 403 })
        expect(rescanFeatures).not.toHaveBeenCalled()
    })
})
