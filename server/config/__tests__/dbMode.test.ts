import { describe, it, expect, vi, afterEach } from 'vitest'

import { getDatabaseUrl } from '../dbMode'

describe('config (getDatabaseUrl)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('DATABASE_URL 값을 반환', () => {
        vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/runnable')
        expect(getDatabaseUrl()).toBe('postgres://localhost:5432/runnable')
    })

    it('미설정이면 throw', () => {
        vi.stubEnv('DATABASE_URL', undefined)
        expect(() => getDatabaseUrl()).toThrow(/DATABASE_URL/)
    })
})
