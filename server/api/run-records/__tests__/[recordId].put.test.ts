import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[recordId].put'

const { getById, update, requireSession } = vi.hoisted(() => ({
    getById: vi.fn(),
    update: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getRunRecordRepository: vi.fn(async () => ({ getById, update }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (recordId: string | undefined, body: any) =>
    ({
        context: { params: { recordId } },
        body,
        method: 'PUT',
        path: '/api/run-records/rr-1'
    }) as any

describe('PUT /api/run-records/[recordId]', () => {
    beforeEach(() => {
        getById.mockReset()
        update.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('recordId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined, {}))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('기록 없으면 404', async () => {
        getById.mockResolvedValue(null)

        await expect(handler(makeEvent('rr-1', {}))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('타인 기록은 403', async () => {
        getById.mockResolvedValue({ recordId: 'rr-1', userId: 'other' })

        await expect(handler(makeEvent('rr-1', {}))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('본인 기록 + 유효 patch → update 호출', async () => {
        getById.mockResolvedValue({ recordId: 'rr-1', userId: 'me' })
        const updated = { recordId: 'rr-1', rpe: 7 }
        update.mockResolvedValue(updated)

        const result = await handler(makeEvent('rr-1', { rpe: 7, notes: 'tired' }))

        expect(update).toHaveBeenCalledWith('rr-1', { rpe: 7, notes: 'tired' })
        expect(result).toBe(updated)
    })

    it('zod 위반 (rpe=11) → 400', async () => {
        getById.mockResolvedValue({ recordId: 'rr-1', userId: 'me' })

        await expect(handler(makeEvent('rr-1', { rpe: 11 }))).rejects.toMatchObject({
            statusCode: 400
        })
        expect(update).not.toHaveBeenCalled()
    })
})
