// DATABASE 관련 환경 변수를 읽어 Postgres 연결 문자열을 만드는 설정 모듈

/** POSTGRES_HOST 미설정 시 기본 호스트 (로컬 직접 실행 기준) */
const DEFAULT_POSTGRES_HOST = 'localhost'
/** POSTGRES_PORT 미설정 시 기본 포트 */
const DEFAULT_POSTGRES_PORT = '5432'

/**
 * Postgres 연결 문자열(DATABASE_URL)을 반환한다.
 *
 * - DATABASE_URL 이 있으면 그대로 사용한다 (compose 등 런타임 주입을 우선).
 * - 없으면 POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
 *   (+ POSTGRES_HOST 기본 localhost, POSTGRES_PORT 기본 5432)로 조립한다.
 * - 둘 다 불가능하면 throw.
 */
export function getDatabaseUrl(): string {
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl) return databaseUrl

    const user = process.env.POSTGRES_USER
    const password = process.env.POSTGRES_PASSWORD
    const db = process.env.POSTGRES_DB
    if (user && password && db) {
        const host = process.env.POSTGRES_HOST || DEFAULT_POSTGRES_HOST
        const port = process.env.POSTGRES_PORT || DEFAULT_POSTGRES_PORT
        return `postgres://${user}:${password}@${host}:${port}/${db}`
    }

    throw new Error('DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB is required.')
}
