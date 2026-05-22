import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import handler from '../run.post'

const { getDb, hashPassword, requireSession, transaction } = vi.hoisted(() => ({
    getDb: vi.fn(),
    hashPassword: vi.fn(),
    requireSession: vi.fn(),
    transaction: vi.fn()
}))
vi.mock('../../../../database/client', () => ({ getDb }))
vi.mock('better-auth/crypto', () => ({ hashPassword }))
vi.mock('../../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const ADMIN_USER = { userId: 'admin-1', role: 50 }

const buildTxBuilder = () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
    const insert = vi.fn().mockReturnValue({ values })
    return { insert, values, onConflictDoUpdate }
}

describe('POST /api/admin/seed/run', () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        getDb.mockReset()
        hashPassword.mockReset().mockImplementation(async (p: string) => `hashed:${p}`)
        requireSession.mockReset().mockResolvedValue(ADMIN_USER)
        transaction.mockReset()

        process.env.NODE_ENV = 'development'
        process.env.ADMIN_SEED_PASSWORD = 'admin-pw'
        process.env.DEVELOPER_SEED_PASSWORD = 'dev-pw'
        process.env.ADMIN_SEED_EMAIL = 'admin@test.com'
        process.env.DEVELOPER_SEED_EMAIL = 'dev@test.com'
    })

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    it('일반 사용자는 403', async () => {
        requireSession.mockResolvedValue({ userId: 'u-1', role: 1 })

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 403 })
    })

    it('NODE_ENV=production 이면 403', async () => {
        process.env.NODE_ENV = 'production'

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 403 })
    })

    it('ADMIN_SEED_PASSWORD 없으면 400', async () => {
        delete process.env.ADMIN_SEED_PASSWORD

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('DEVELOPER_SEED_PASSWORD 없으면 400', async () => {
        delete process.env.DEVELOPER_SEED_PASSWORD

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('정상 시드 → 관리자/개발자 계정 4번의 insert 실행 + success 반환', async () => {
        const tx = buildTxBuilder()
        transaction.mockImplementation(async (cb: any) => cb(tx))
        getDb.mockResolvedValue({ transaction })

        const result = await handler({ context: {} } as any)

        expect(getDb).toHaveBeenCalled()
        // users + userAccounts × admin + developer = 4 insert
        expect(tx.insert).toHaveBeenCalledTimes(4)
        // hashPassword 는 admin/developer 각각 1회씩
        expect(hashPassword).toHaveBeenCalledWith('admin-pw')
        expect(hashPassword).toHaveBeenCalledWith('dev-pw')

        expect(result.success).toBe(true)
        expect(result.message).toContain('시드 완료')
        expect(typeof result.executedAt).toBe('string')
    })
})
