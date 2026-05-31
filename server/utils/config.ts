// DB 모드(PGLITE/POSTGRES) 환경 변수를 읽고 검증하는 설정 모듈
export type DbMode = 'PGLITE' | 'POSTGRES'

const raw = process.env.USE_DATABASE_MODE ?? 'PGLITE'

if (raw !== 'PGLITE' && raw !== 'POSTGRES') {
    throw new Error(`USE_DATABASE_MODE must be PGLITE or POSTGRES, got: ${raw}`)
}

if (raw === 'PGLITE' && process.env.NODE_ENV === 'production') {
    throw new Error('PGLITE mode must not be used in production.')
}

export const dbMode: DbMode = raw as DbMode
export const isPgliteMode = dbMode === 'PGLITE'
