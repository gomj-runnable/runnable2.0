import { describe, it, expect, vi, afterEach } from 'vitest'

describe('config (USE_DATABASE_MODE)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
        vi.resetModules()
    })

    it('기본값은 PGLITE', async () => {
        const original = process.env.USE_DATABASE_MODE
        delete process.env.USE_DATABASE_MODE
        vi.stubEnv('NODE_ENV', 'test')
        vi.resetModules()
        try {
            const mod = await import('../config')
            expect(mod.dbMode).toBe('PGLITE')
            expect(mod.isPgliteMode).toBe(true)
        } finally {
            if (original !== undefined) process.env.USE_DATABASE_MODE = original
        }
    })

    it('POSTGRES 로 설정 가능', async () => {
        vi.stubEnv('USE_DATABASE_MODE', 'POSTGRES')
        vi.resetModules()
        const mod = await import('../config')
        expect(mod.dbMode).toBe('POSTGRES')
        expect(mod.isPgliteMode).toBe(false)
    })

    it('알 수 없는 값은 import 시 throw', async () => {
        vi.stubEnv('USE_DATABASE_MODE', 'SQLITE')
        vi.resetModules()
        await expect(import('../config')).rejects.toThrow(/USE_DATABASE_MODE/)
    })

    it('production 에서 PGLITE 는 throw', async () => {
        vi.stubEnv('USE_DATABASE_MODE', 'PGLITE')
        vi.stubEnv('NODE_ENV', 'production')
        vi.resetModules()
        await expect(import('../config')).rejects.toThrow(/production/)
    })
})
