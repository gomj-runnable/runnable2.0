// DATABASE 관련 환경 변수(DATABASE_URL)를 읽어 검증하는 설정 모듈

/**
 * DATABASE_URL 환경 변수를 읽어 반환한다 (Postgres 연결 문자열).
 * 미설정이면 throw.
 */
export function getDatabaseUrl(): string {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) throw new Error('DATABASE_URL is required.')

    return databaseUrl
}
