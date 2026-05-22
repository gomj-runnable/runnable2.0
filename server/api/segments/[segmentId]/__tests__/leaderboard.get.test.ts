import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../leaderboard.get'

const { getLeaderboard, getSessionUser } = vi.hoisted(() => ({
    getLeaderboard: vi.fn(),
    getSessionUser: vi.fn()
}))
vi.mock('../../../../repositories', () => ({
    getSegmentRepository: vi.fn(async () => ({ getLeaderboard }))
}))
vi.mock('../../../../utils/session', () => ({ getSessionUser }))

const makeEvent = (segmentId?: string) => ({ context: { params: { segmentId } } }) as any

describe('GET /api/segments/[segmentId]/leaderboard', () => {
    beforeEach(() => {
        getLeaderboard.mockReset()
        getSessionUser.mockReset()
    })

    it('segmentId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('로그인 사용자 ID 와 함께 leaderboard 조회 (limit 10)', async () => {
        getSessionUser.mockResolvedValue({ userId: 'me' })
        const fixture = [{ userId: 'me', durationSec: 600 }]
        getLeaderboard.mockResolvedValue(fixture)

        const result = await handler(makeEvent('s-1'))

        expect(getLeaderboard).toHaveBeenCalledWith('s-1', 'me', 10)
        expect(result).toBe(fixture)
    })

    it('비로그인은 userId undefined 로 호출', async () => {
        getSessionUser.mockResolvedValue(null)
        getLeaderboard.mockResolvedValue([])

        await handler(makeEvent('s-1'))

        expect(getLeaderboard).toHaveBeenCalledWith('s-1', undefined, 10)
    })
})
