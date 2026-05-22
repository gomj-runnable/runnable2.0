import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.post'

const { create, requireSession } = vi.hoisted(() => ({
    create: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getRunRecordRepository: vi.fn(async () => ({ create }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const validBody = {
    runDate: '2026-05-22',
    distanceKm: 5,
    durationSec: 1800,
    avgPaceSecPerKm: 360,
    rpe: 6,
    condition: 'normal' as const
}

const makeEvent = (body: any) =>
    ({ context: {}, body, method: 'POST', path: '/api/run-records' }) as any

describe('POST /api/run-records', () => {
    beforeEach(() => {
        create.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('유효 body 면 repo.create(input, userId) 위임', async () => {
        const saved = { recordId: 'rr-1' }
        create.mockResolvedValue(saved)

        const result = await handler(makeEvent(validBody))

        expect(create).toHaveBeenCalledWith(expect.objectContaining(validBody), 'me')
        expect(result).toBe(saved)
    })

    it('zod 위반 (distanceKm 음수) → 400', async () => {
        await expect(handler(makeEvent({ ...validBody, distanceKm: -1 }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(create).not.toHaveBeenCalled()
    })

    it('세션 없으면 401', async () => {
        requireSession.mockRejectedValue(
            Object.assign(new Error('Unauthorized'), { statusCode: 401 })
        )

        await expect(handler(makeEvent(validBody))).rejects.toMatchObject({ statusCode: 401 })
    })
})
