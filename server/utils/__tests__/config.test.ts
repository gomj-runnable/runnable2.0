import { describe, it, expect, vi, afterEach } from 'vitest'

import { DATABASE_MODE, getDbMode } from '../../config/dbMode'

describe('config (getDbMode)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('DATABASE_MODE=PGLITE 면 PGLITE 반환', () => {
        vi.stubEnv('DATABASE_MODE', 'PGLITE')
        expect(getDbMode()).toBe(DATABASE_MODE.PGLITE)
    })

    it('DATABASE_MODE=POSTGRES 면 POSTGRES 반환', () => {
        vi.stubEnv('DATABASE_MODE', 'POSTGRES')
        expect(getDbMode()).toBe(DATABASE_MODE.POSTGRES)
    })

    it('미설정이면 throw', () => {
        const original = process.env.DATABASE_MODE
        delete process.env.DATABASE_MODE
        try {
            expect(() => getDbMode()).toThrow(/DATABASE_MODE/)
        } finally {
            if (original !== undefined) process.env.DATABASE_MODE = original
        }
    })

    it('알 수 없는 값이면 throw', () => {
        vi.stubEnv('DATABASE_MODE', 'SQLITE')
        expect(() => getDbMode()).toThrow(/DATABASE_MODE/)
    })
})
