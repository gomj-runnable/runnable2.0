// better-auth 인스턴스를 초기화하고 싱글턴으로 반환하는 모듈
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '../../database/client'
import { users, userSessions, userAccounts, userVerifications } from '../../database/schema/users'
import { getEnvMode, ENVIRONMENT_MODE } from '../../config/envMode'
import { getAuthSecret, getAuthBaseURL, getAuthTrustedOrigins } from './env'

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
export async function getAuthMode(): Promise<AuthInstance> {
    // authInstance가 할당되었다면, 그대로 반환한다. (Singleton)
    if (authInstance) return authInstance

    const db = await getDb()

    // ENVIRONMENT_MODE 검증 (DEVELOP|PRODUCT 가 아니면 throw)
    const isProduct = getEnvMode() === ENVIRONMENT_MODE.PRODUCT

    // better-auth 인스턴스 반환
    authInstance = betterAuth({
        // 세션/토큰 서명에 쓰는 비밀키 (BETTER_AUTH_SECRET 환경 변수)
        secret: getAuthSecret(),
        // 인증 콜백·쿠키 도메인 기준이 되는 앱 base URL (미설정 시 localhost)
        baseURL: getAuthBaseURL(),
        // CSRF 방어용 신뢰 출처 화이트리스트 (쉼표 구분, 미설정 시 비활성)
        trustedOrigins: getAuthTrustedOrigins(),
        // 쿠키 보안 정책 — 운영(PRODUCT)에서만 Secure/HTTPS 강제
        advanced: {
            useSecureCookies: isProduct,
            defaultCookieAttributes: {
                sameSite: 'lax' as const, // 동일 사이트 요청에만 쿠키 전송 (CSRF 완화)
                secure: isProduct, // HTTPS 연결에서만 쿠키 전송 (운영)
                httpOnly: true // JS 접근 차단 (XSS 시 쿠키 탈취 방지)
            }
        },
        // DB 어댑터 — Drizzle + PostgreSQL, 인증 4개 테이블 매핑
        database: drizzleAdapter(db, {
            provider: 'pg',
            schema: {
                user: users, // 사용자 계정
                session: userSessions, // 로그인 세션
                account: userAccounts, // 자격 증명·소셜 계정
                verification: userVerifications // 이메일 인증 토큰
            }
        }),
        // 이메일+비밀번호 로그인 활성화 (최소 10자)
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 10
        },
        // user 테이블 확장 필드 — 권한·밴 상태 (서버 전용, 가입 입력 불가)
        user: {
            additionalFields: {
                // 권한 레벨 (기본 1)
                role: { type: 'number', required: false, defaultValue: 1, input: false },
                // 밴 여부
                banned: { type: 'boolean', required: false, defaultValue: false, input: false },
                // 밴 사유
                banReason: { type: 'string', required: false, input: false },
                // 밴 만료 시각
                banExpires: { type: 'date', required: false, input: false }
            }
        },
        // 세션 유효기간 — 30일
        session: {
            expiresIn: 60 * 60 * 24 * 30 // 30일
        }
    })
    return authInstance
}
