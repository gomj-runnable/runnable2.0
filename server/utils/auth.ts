import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import { users, userSessions, userAccounts, userVerifications } from '../database/schema/users'

export const auth = betterAuth({
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
        disableSignUp: true
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
