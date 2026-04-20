import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import { users, userSessions, userAccounts, userVerifications } from '../database/schema/users'
import { isMemoryMode } from './config'
import { createAuthService } from './auth.service'

export type AuthInstance = ReturnType<typeof betterAuth> | null

const betterAuthInstance: AuthInstance = isMemoryMode ? null : betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db!, {
        provider: 'pg',
        schema: {
            user: users,
            session: userSessions,
            account: userAccounts,
            verification: userVerifications
        }
    }),
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: { type: 'number', required: false, defaultValue: 1, input: false },
            banned: { type: 'boolean', required: false, defaultValue: false, input: false },
            banReason: { type: 'string', required: false, input: false },
            banExpires: { type: 'date', required: false, input: false }
        }
    },
    // 관리자 편의를 위해 세션 기간 추가
    session: {
        expiresIn: 60 * 60 * 24 * 30 // 30일
    }
})

/** better-auth 인스턴스. MEMORY 모드에서는 null */
export const auth = betterAuthInstance

/** IAuthService 구현체. isMemoryMode에 따라 자동 선택 */
export const authService = createAuthService(betterAuthInstance)
