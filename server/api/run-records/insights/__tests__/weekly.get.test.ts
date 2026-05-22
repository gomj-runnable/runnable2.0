import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../weekly.get'

const { getWeeklyInsight, requireSession } = vi.hoisted(() => ({
    getWeeklyInsight: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../../repositories', () => ({
    getRunRecordRepository: vi.fn(async () => ({ getWeeklyInsight }))
}))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (query: Record<string, string> = {}) => ({ context: {}, query }) as any

describe('GET /api/run-records/insights/weekly', () => {
    beforeEach(() => {
        getWeeklyInsight.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('weekStart 누락 → 400', async () => {
        await expect(handler(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
        expect(getWeeklyInsight).not.toHaveBeenCalled()
    })

    it.each([
        ['형식 어긋남 (slash)', '2026/05/19'],
        ['day 누락', '2026-05'],
        ['빈 문자열', '']
    ])('%s → 400', async (_label, value) => {
        await expect(handler(makeEvent({ weekStart: value }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(getWeeklyInsight).not.toHaveBeenCalled()
    })

    it('유효한 weekStart → repo.getWeeklyInsight(userId, weekStart)', async () => {
        const insight = { totalDistanceKm: 25 }
        getWeeklyInsight.mockResolvedValue(insight)

        const result = await handler(makeEvent({ weekStart: '2026-05-19' }))

        expect(getWeeklyInsight).toHaveBeenCalledWith('me', '2026-05-19')
        expect(result).toBe(insight)
    })
})
