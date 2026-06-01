import { describe, it, expect, vi, afterEach } from 'vitest'

import {
    getAuthSecret,
    getAuthBaseURL,
    getAuthTrustedOrigins,
    assertProductionAuthEnv
} from '../authEnv'

describe('authEnv (getAuthSecret)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('BETTER_AUTH_SECRET 값을 반환', () => {
        vi.stubEnv('BETTER_AUTH_SECRET', 'super-secret')
        expect(getAuthSecret()).toBe('super-secret')
    })

    it('미설정이면 undefined', () => {
        vi.stubEnv('BETTER_AUTH_SECRET', undefined)
        expect(getAuthSecret()).toBeUndefined()
    })
})

describe('authEnv (getAuthBaseURL)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('BETTER_AUTH_URL 이 있으면 그 값을 반환', () => {
        vi.stubEnv('BETTER_AUTH_URL', 'https://app.runnable.com')
        expect(getAuthBaseURL()).toBe('https://app.runnable.com')
    })

    it('BETTER_AUTH_URL 미설정 시 PORT 기반 localhost 로 폴백', () => {
        vi.stubEnv('BETTER_AUTH_URL', undefined)
        vi.stubEnv('PORT', '4000')
        expect(getAuthBaseURL()).toBe('http://localhost:4000')
    })

    it('BETTER_AUTH_URL·PORT 모두 미설정 시 기본 포트 3000', () => {
        vi.stubEnv('BETTER_AUTH_URL', undefined)
        vi.stubEnv('PORT', undefined)
        expect(getAuthBaseURL()).toBe('http://localhost:3000')
    })
})

describe('authEnv (getAuthTrustedOrigins)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('쉼표로 구분해 배열로 반환', () => {
        vi.stubEnv('BETTER_AUTH_TRUSTED_ORIGINS', 'https://a.com,https://b.com')
        expect(getAuthTrustedOrigins()).toEqual(['https://a.com', 'https://b.com'])
    })

    it('미설정이면 undefined', () => {
        vi.stubEnv('BETTER_AUTH_TRUSTED_ORIGINS', undefined)
        expect(getAuthTrustedOrigins()).toBeUndefined()
    })
})

describe('authEnv (assertProductionAuthEnv)', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('secret(>=32자) 과 https URL 이면 통과', () => {
        vi.stubEnv('BETTER_AUTH_SECRET', 'a'.repeat(32))
        vi.stubEnv('BETTER_AUTH_URL', 'https://app.runnable.com')
        expect(() => assertProductionAuthEnv()).not.toThrow()
    })

    it('secret 미설정이면 throw', () => {
        vi.stubEnv('BETTER_AUTH_SECRET', undefined)
        vi.stubEnv('BETTER_AUTH_URL', 'https://app.runnable.com')
        expect(() => assertProductionAuthEnv()).toThrow(/BETTER_AUTH_SECRET/)
    })

    it('secret 이 32자 미만이면 throw', () => {
        vi.stubEnv('BETTER_AUTH_SECRET', 'short')
        vi.stubEnv('BETTER_AUTH_URL', 'https://app.runnable.com')
        expect(() => assertProductionAuthEnv()).toThrow(/BETTER_AUTH_SECRET/)
    })

    it('URL 이 https 가 아니면 throw', () => {
        vi.stubEnv('BETTER_AUTH_SECRET', 'a'.repeat(32))
        vi.stubEnv('BETTER_AUTH_URL', 'http://app.runnable.com')
        expect(() => assertProductionAuthEnv()).toThrow(/BETTER_AUTH_URL/)
    })
})
