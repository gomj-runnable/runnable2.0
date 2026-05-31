// BETTER_AUTH 관련 환경 변수를 읽어 검증하는 설정 모듈
// (authMode.ts 의 better-auth 인스턴스 생성과 00-boot-check.ts 의 부팅 검증이 공유)

/** 운영 환경에서 BETTER_AUTH_SECRET 에 요구되는 최소 길이 */
const MIN_SECRET_LENGTH = 32

/** 기본 포트 (PORT 미설정 시) */
const DEFAULT_PORT = 3000

/**
 * 세션/토큰 서명에 쓰는 비밀키 (BETTER_AUTH_SECRET).
 * better-auth 가 undefined 를 허용하므로 raw 값을 그대로 반환한다.
 */
export function getAuthSecret(): string | undefined {
    return process.env.BETTER_AUTH_SECRET
}

/**
 * 인증 콜백·쿠키 도메인 기준이 되는 앱 base URL (BETTER_AUTH_URL).
 * 미설정 시 http://localhost:{PORT} 로 폴백한다.
 */
export function getAuthBaseURL(): string {
    return process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || DEFAULT_PORT}`
}

/**
 * CSRF 방어용 신뢰 출처 화이트리스트 (BETTER_AUTH_TRUSTED_ORIGINS, 쉼표 구분).
 * 미설정 시 undefined (비활성).
 */
export function getAuthTrustedOrigins(): string[] | undefined {
    const origins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    return origins ? origins.split(',') : undefined
}

/**
 * 운영(PRODUCT) 환경에서 BETTER_AUTH 설정이 안전한지 검증한다.
 * secret 미설정/짧음 또는 url 이 https:// 가 아니면 throw.
 */
export function assertProductionAuthEnv(): void {
    const secret = getAuthSecret()
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
        throw new Error(
            `BETTER_AUTH_SECRET must be set and >= ${MIN_SECRET_LENGTH} chars in production`
        )
    }

    const url = process.env.BETTER_AUTH_URL
    if (!url?.startsWith('https://')) {
        throw new Error('BETTER_AUTH_URL must be https:// in production')
    }
}
