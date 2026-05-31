// better-auth 인스턴스를 초기화하고 싱글턴으로 반환하는 모듈
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '../database/client'
import { users, userSessions, userAccounts, userVerifications } from '../database/schema/users'

export type AuthInstance = ReturnType<typeof betterAuth>

let _auth: AuthInstance | null = null

export async function getAuthInstance(): Promise<AuthInstance> {
    if (_auth) return _auth
    const db = await getDb()
    const isProduction = process.env.NODE_ENV === 'production'

    _auth = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 3000}`,
        trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
            ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
            : undefined,
        advanced: {
            useSecureCookies: isProduction,
            defaultCookieAttributes: {
                sameSite: 'lax' as const,
                secure: isProduction,
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
    return _auth
}
