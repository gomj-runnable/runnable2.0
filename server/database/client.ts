import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { resolve } from 'node:path'
import * as schema from './schema'
import { getDatabaseUrl } from '../config/dbMode'

/**
 * Drizzle DB 타입 선언.
 *
 * Runnable 은 Postgres/PostGIS 단일 DBMS 를 사용한다.
 * Singleton 으로 이용하는 객체.
 */
type DrizzleDb = ReturnType<typeof drizzlePg<typeof schema>>

let database: DrizzleDb | null = null

// Nitro 번들 환경에서 import.meta.url 은 .nuxt/dev/ 같은 빌드 산출물 경로를 가리키므로
// process.cwd() (= 프로젝트 루트) 기준으로 마이그레이션 디렉터리를 찾는다.
const MIGRATIONS_FOLDER = resolve(process.cwd(), 'server/database/migrations')

/**
 * DATABASE_URL 로 실제 접속이 가능한지 확인한다.
 * 접속할 수 없으면 명시적인 예외를 던진다.
 */
async function assertConnectable(pool: pg.Pool, url: string): Promise<void> {
    try {
        const client = await pool.connect()
        client.release()
    } catch {
        throw new Error(`${url} DB 접속 실패`)
    }
}

/**
 * 핵심 테이블(users)이 이미 존재하는지 확인한다.
 * 존재하지 않으면 스키마가 아직 적용되지 않은 것으로 보고 마이그레이션을 실행한다.
 */
async function hasCoreTables(pool: pg.Pool): Promise<boolean> {
    const res = await pool.query<{ exists: boolean }>(
        `SELECT to_regclass('public.users') IS NOT NULL AS exists`
    )
    return res.rows[0]?.exists === true
}

/**
 * 서버의 DataBase 정보를 얻는다.
 *
 * - DATABASE_URL 로 접속을 시도하고, 실패하면 '{DATABASE_URL} DB 접속 실패' 예외를 던진다.
 * - 접속은 됐지만 테이블이 없으면 마이그레이션을 실행해 스키마를 생성한다.
 */
export async function getDb(): Promise<DrizzleDb> {
    if (database) return database

    const url = getDatabaseUrl()
    const pool = new pg.Pool({ connectionString: url })
    await assertConnectable(pool, url)

    const db = drizzlePg(pool, { schema })
    if (!(await hasCoreTables(pool))) {
        await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
    }

    database = db
    return database
}

/**
 * 테스트용: 주어진 연결 문자열로 싱글턴을 초기화하고 마이그레이션을 적용한다
 * (보통 Testcontainers 가 기동한 격리된 PostGIS 인스턴스의 URL).
 */
export async function initTestDb(connectionString: string): Promise<DrizzleDb> {
    const pool = new pg.Pool({ connectionString })
    const db = drizzlePg(pool, { schema })
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
    database = db
    return database
}

/** 싱글턴 초기화 — 테스트 전용. */
export function resetDb(): void {
    database = null
}
