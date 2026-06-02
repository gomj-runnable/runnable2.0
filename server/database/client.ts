import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import * as schema from './schema'
import { getDbMode, getDatabaseUrl, DATABASE_MODE } from '../config/dbMode'

/**
 * DrizzleDB Type 선언
 *
 * Runnable에서 사용하는 DB는 다음과 같다.
 * - PostgreSQL: PRODUCT
 * - PgLite: DEVELOP
 */
type DrizzleDb =
    | ReturnType<typeof drizzlePg<typeof schema>>
    | ReturnType<typeof drizzlePglite<typeof schema>>

/**
 * Postgres DB 인스턴스.
 *
 * Drizzle로 관리한다.
 *
 * Singleton으로 이용하는 객체
 */
let database: DrizzleDb | null = null

// PGlite(WASM)에는 PostGIS 가 없다 — GEOS/PROJ 등 거대한 네이티브 의존성 때문에
// dev(PGlite)에선 앱 레벨(haversine.ts 등)로 대체해 동작
const POSTGIS_PATTERN = /CREATE\s+EXTENSION|geometry\s*\(|ST_[A-Za-z]+|USING\s+gist|\bPostGIS\b/i

/**
 * 마이그레이션 SQL 을 PGlite 에서 실행 가능한 개별 구문 배열로 변환한다.
 *
 * drizzle 구분자(`--> statement-breakpoint`)가 있으면 그 기준으로,
 * 없으면 세미콜론+개행 기준으로 구문을 나눈다. 이후 각 구문을 trim 하고
 * 빈 구문과 PostGIS 의존 구문(POSTGIS_PATTERN 매칭)을 제거한다.
 *
 * @param sql 마이그레이션 파일의 원본 SQL 전체 문자열
 * @returns PGlite 에서 안전하게 실행 가능한 SQL 구문 배열
 */
function sanitizeForPglite(sql: string): string[] {
    // drizzle 마이그레이션 구분자로 분리; 없으면 세미콜론 기준으로 분리
    const raw = sql.includes('--> statement-breakpoint')
        ? sql.split('--> statement-breakpoint')
        : sql.split(/;\s*\n/)

    return raw.map((s) => s.trim()).filter((s) => s.length > 0 && !POSTGIS_PATTERN.test(s))
}

async function bootstrapPglite(pglite: PGlite): Promise<void> {
    // Nitro 번들 환경에서 import.meta.url 은 .nuxt/dev/ 같은 빌드 산출물 경로를 가리키므로
    // process.cwd() (= 프로젝트 루트) 기준으로 마이그레이션 디렉터리를 찾는다.
    const migrationsDir = resolve(process.cwd(), 'server/database/migrations')

    // 파일 기반 영속(.data/pglite)에서 동일 마이그레이션을 재실행하지 않도록 적용 이력을 추적한다.
    await pglite.exec(`
        CREATE TABLE IF NOT EXISTS __pglite_migrations (
            file text PRIMARY KEY,
            applied_at timestamp DEFAULT now()
        )
    `)
    const appliedRes = await pglite.query<{ file: string }>('SELECT file FROM __pglite_migrations')
    const applied = new Set(appliedRes.rows.map((r) => r.file))

    const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()

    for (const file of files) {
        if (applied.has(file)) continue
        const sql = readFileSync(resolve(migrationsDir, file), 'utf-8')
        const statements = sanitizeForPglite(sql)
        for (const stmt of statements) {
            await pglite.exec(stmt)
        }
        await pglite.query('INSERT INTO __pglite_migrations (file) VALUES ($1)', [file])
    }
}

/**
 * 서버의 DataBase 정보를 얻는다.
 */
export async function getDb(): Promise<DrizzleDb> {
    // database가 할당되었다면,
    if (database) return database

    // 환경 변수 기반으로 PGLITE/POSTGRES 분기
    if (getDbMode() === DATABASE_MODE.PGLITE) {
        // 개발 환경에선 파일 기반 영속; 테스트는 initPgliteDb() 로 new PGlite() 를 외부 주입한다.
        const dataPath = resolve(process.cwd(), '.data/pglite')
        mkdirSync(dataPath, { recursive: true })
        const pglite = new PGlite(dataPath)
        await bootstrapPglite(pglite)
        database = drizzlePglite(pglite, { schema })
    } else {
        const pool = new pg.Pool({ connectionString: getDatabaseUrl() })
        database = drizzlePg(pool, { schema })
    }

    return database
}

/**
 * 테스트용: 호출자가 제공한 PGlite 인스턴스로 싱글턴을 초기화한다
 * (보통 인메모리 격리를 위한 `new PGlite()`).
 */
export async function initPgliteDb(pglite: PGlite): Promise<DrizzleDb> {
    await bootstrapPglite(pglite)
    database = drizzlePglite(pglite, { schema })
    return database
}

/** 싱글턴 초기화 — 테스트 전용. */
export function resetDb(): void {
    database = null
}
