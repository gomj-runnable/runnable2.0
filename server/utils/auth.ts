// better-auth 인스턴스를 초기화하고 싱글턴으로 반환하는 모듈
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '../database/client'
import { users, userSessions, userAccounts, userVerifications } from '../database/schema/users'
import { getEnvMode, ENVIRONMENT_MODE } from '../config/envMode'

export type AuthInstance = ReturnType<typeof betterAuth>

/**
 * Better Auth 인스턴스.
 *
 * Singleton으로 이용하는 객체
 */
let authInstance: AuthInstance | null = null

/**
 * BetterAuth 설정 정의를 위한 함수선언
 */
export async function getAuthInstance(): Promise<AuthInstance> {
    // authInstance가 할당되었다면, 그대로 반환한다. (Singleton)
    if (authInstance) return authInstance

    const db = await getDb()

    // ENVIRONMENT_MODE 검증 (DEVELOP|PRODUCT 가 아니면 throw)
    const isProduct = getEnvMode() === ENVIRONMENT_MODE.PRODUCT

    // better-auth 인스턴스 반환
    authInstance = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET, // Better Auth Secret ID
        baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 3000}`,
        trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
            ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
            : undefined,
        advanced: {
            useSecureCookies: isProduct,
            defaultCookieAttributes: {
                sameSite: 'lax' as const,
                secure: isProduct,
                httpOnly: true
            }
        },
        database: drizzleAdapter(db, {
            provider: 'pg',
            schema: {
                user: users,
                session: userSessions,
                account: userAccounts,
                verification: userVerifications
            }
        }),
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 10
        },
        user: {
            additionalFields: {
                role: { type: 'number', required: false, defaultValue: 1, input: false },
                banned: { type: 'boolean', required: false, defaultValue: false, input: false },
                banReason: { type: 'string', required: false, input: false },
                banExpires: { type: 'date', required: false, input: false }
            }
        },
        session: {
            expiresIn: 60 * 60 * 24 * 30 // 30일
        }
    })
    return authInstance
}
