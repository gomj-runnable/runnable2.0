import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../[recordId].delete'

const { getById, deleteRecord, requireSession } = vi.hoisted(() => ({
    getById: vi.fn(),
    deleteRecord: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../repositories', () => ({
    getRunRecordRepository: vi.fn(async () => ({ getById, delete: deleteRecord }))
}))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (recordId?: string) => ({ context: { params: { recordId } } }) as any

describe('DELETE /api/run-records/[recordId]', () => {
    beforeEach(() => {
        getById.mockReset()
        deleteRecord.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'me' })
    })

    it('recordId 누락 → 400', async () => {
        await expect(handler(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 400 })
    })

    it('기록 없으면 404', async () => {
        getById.mockResolvedValue(null)

        await expect(handler(makeEvent('rr-1'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('타인 기록은 403', async () => {
        getById.mockResolvedValue({ recordId: 'rr-1', userId: 'other' })

        await expect(handler(makeEvent('rr-1'))).rejects.toMatchObject({ statusCode: 403 })
    })

    it('본인 기록 삭제', async () => {
        getById.mockResolvedValue({ recordId: 'rr-1', userId: 'me' })
        deleteRecord.mockResolvedValue(undefined)

        const result = await handler(makeEvent('rr-1'))

        expect(deleteRecord).toHaveBeenCalledWith('rr-1')
        expect(result).toEqual({ success: true })
    })
})
