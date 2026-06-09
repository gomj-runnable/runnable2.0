import { describe, it, expect, vi, afterEach } from 'vitest'

import { getDatabaseUrl } from '../dbMode'

describe('config (getDatabaseUrl)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('DATABASE_URL 이 있으면 그대로 반환', () => {
        vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/runnable')
        expect(getDatabaseUrl()).toBe('postgres://localhost:5432/runnable')
    })

    it('DATABASE_URL 없고 POSTGRES_* 있으면 조립', () => {
        vi.stubEnv('DATABASE_URL', undefined)
        vi.stubEnv('POSTGRES_USER', 'runnable')
        vi.stubEnv('POSTGRES_PASSWORD', 'secret')
        vi.stubEnv('POSTGRES_DB', 'runnable')
        vi.stubEnv('POSTGRES_HOST', 'db')
        vi.stubEnv('POSTGRES_PORT', '6543')
        expect(getDatabaseUrl()).toBe('postgres://runnable:secret@db:6543/runnable')
    })

    it('POSTGRES_HOST/PORT 미설정 시 localhost:5432 기본값', () => {
        vi.stubEnv('DATABASE_URL', undefined)
        vi.stubEnv('POSTGRES_USER', 'runnable')
        vi.stubEnv('POSTGRES_PASSWORD', 'secret')
        vi.stubEnv('POSTGRES_DB', 'runnable')
        vi.stubEnv('POSTGRES_HOST', undefined)
        vi.stubEnv('POSTGRES_PORT', undefined)
        expect(getDatabaseUrl()).toBe('postgres://runnable:secret@localhost:5432/runnable')
    })

    it('DATABASE_URL·POSTGRES_* 모두 없으면 throw', () => {
        vi.stubEnv('DATABASE_URL', undefined)
        vi.stubEnv('POSTGRES_USER', undefined)
        vi.stubEnv('POSTGRES_PASSWORD', undefined)
        vi.stubEnv('POSTGRES_DB', undefined)
        expect(() => getDatabaseUrl()).toThrow(/DATABASE_URL/)
    })
})
