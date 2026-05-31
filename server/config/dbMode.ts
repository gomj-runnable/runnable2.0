// DATABASE_MODE(PGLITE/POSTGRES)를 환경 변수에서 읽어 검증하는 설정 모듈

/** 지원하는 DATABASE 실행 모드 (POSTGRES: 운영, PGLITE: 개발) */
export const DATABASE_MODE = {
    POSTGRES: 'POSTGRES',
    PGLITE: 'PGLITE'
} as const

/** DATABASE_MODE 값 유니온 타입 ('POSTGRES' | 'PGLITE') */
export type DbMode = (typeof DATABASE_MODE)[keyof typeof DATABASE_MODE]

/**
 * DATABASE_MODE 환경 변수를 읽어 DbMode 로 검증·반환한다.
 * 미설정이거나 허용되지 않은 값이면 throw.
 */
export function getDbMode(): DbMode {
    const dbMode = process.env.DATABASE_MODE
    if (dbMode === undefined || !Object.values(DATABASE_MODE).includes(dbMode as DbMode))
        throw new Error(
            `DATABASE_MODE must be one of [${Object.values(DATABASE_MODE).join(', ')}], got: ${dbMode ?? 'undefined'}`
        )

    return dbMode as DbMode
}
