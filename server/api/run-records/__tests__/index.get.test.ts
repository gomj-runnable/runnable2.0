import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../index.get'

const { listByUser, requireSession } = vi.hoisted(() => ({
    listByUser: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getRunRecordRepository: vi.fn(async () => ({ listByUser }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (query: Record<string, string> = {}) => ({ context: {}, query }) as any

describe('GET /api/run-records', () => {
    beforeEach(() => {
        listByUser.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('기본 limit=50, offset=0 으로 호출', async () => {
        listByUser.mockResolvedValue([])

        await handler(makeEvent({}))

        expect(listByUser).toHaveBeenCalledWith('me', 50, 0)
    })

    it('limit / offset 쿼리 반영', async () => {
        listByUser.mockResolvedValue([])

        await handler(makeEvent({ limit: '10', offset: '20' }))

        expect(listByUser).toHaveBeenCalledWith('me', 10, 20)
    })

    it('limit=0 (NaN/Falsy) → 50 으로 fallback', async () => {
        listByUser.mockResolvedValue([])

        await handler(makeEvent({ limit: 'abc' }))

        expect(listByUser).toHaveBeenCalledWith('me', 50, 0)
    })
})
