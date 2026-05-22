import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../analyze.post'

const { getOrDetectFeatures, findFeatures, analyzeFeatures, requireSession } = vi.hoisted(() => ({
    getOrDetectFeatures: vi.fn(),
    findFeatures: vi.fn(),
    analyzeFeatures: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../utils/uml/detect-features', () => ({ getOrDetectFeatures, findFeatures }))
vi.mock('../../../utils/uml/analyzers', () => ({ analyzeFeatures }))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

const validBody = {
    domain: 'backend',
    featureIds: ['feat-1'],
    diagramType: 'class'
}

const makeEvent = (body: any) =>
    ({ context: {}, body, method: 'POST', path: '/api/uml/analyze' }) as any

describe('POST /api/uml/analyze', () => {
    beforeEach(() => {
        getOrDetectFeatures.mockReset()
        findFeatures.mockReset()
        analyzeFeatures.mockReset()
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler(makeEvent(validBody))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('zod 위반 (잘못된 domain) → 400', async () => {
        await expect(handler(makeEvent({ ...validBody, domain: 'invalid' }))).rejects.toMatchObject(
            { statusCode: 400 }
        )
    })

    it('매칭 Feature 가 0개면 400', async () => {
        getOrDetectFeatures.mockResolvedValue({ features: [] })
        findFeatures.mockReturnValue([])

        await expect(handler(makeEvent(validBody))).rejects.toMatchObject({ statusCode: 400 })
        expect(analyzeFeatures).not.toHaveBeenCalled()
    })

    it('매칭 Feature 가 있으면 analyzeFeatures 호출 후 결과 반환', async () => {
        const payload = { features: [{ id: 'feat-1' }] }
        const features = [{ id: 'feat-1' }]
        getOrDetectFeatures.mockResolvedValue(payload)
        findFeatures.mockReturnValue(features)
        const result = { diagram: 'mermaid...' }
        analyzeFeatures.mockResolvedValue(result)

        const response = await handler(makeEvent(validBody))

        expect(findFeatures).toHaveBeenCalledWith(payload, 'backend', ['feat-1'])
        expect(analyzeFeatures).toHaveBeenCalledWith(features, 'class')
        expect(response).toBe(result)
    })
})
