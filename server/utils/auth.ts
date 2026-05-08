import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '../database/client'
import { users, userSessions, userAccounts, userVerifications } from '../database/schema/users'

export type AuthInstance = ReturnType<typeof betterAuth>

let _auth: AuthInstance | null = null

export async function getAuthInstance(): Promise<AuthInstance> {
    if (_auth) return _auth
    const db = await getDb()
    _auth = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 3000}`,
        trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
            ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
            : undefined,
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
            minPasswordLength: 6
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
