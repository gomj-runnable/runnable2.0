import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import * as schema from './schema'
import { dbMode } from '../utils/config'

type DrizzleDb =
    | ReturnType<typeof drizzlePg<typeof schema>>
    | ReturnType<typeof drizzlePglite<typeof schema>>

let _db: DrizzleDb | null = null

// PGlite: filter out PostGIS-dependent SQL statements before applying migrations.
// PGlite has no PostGIS (requires native C lib), so we skip:
//   - CREATE EXTENSION lines
//   - statements referencing geometry( columns
//   - statements using ST_ functions
//   - statements using USING gist index method
//   - any explicit PostGIS keyword
const POSTGIS_PATTERN = /CREATE\s+EXTENSION|geometry\s*\(|ST_[A-Za-z]+|USING\s+gist|\bPostGIS\b/i

function sanitizeForPglite(sql: string): string[] {
    // Split on drizzle migration separator; fall back to semicolon splitting
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

export async function getDb(): Promise<DrizzleDb> {
    if (_db) return _db

    if (dbMode === 'PGLITE') {
        // File-based persistence in dev; tests pass new PGlite() externally via initPgliteDb()
        const dataPath = resolve(process.cwd(), '.data/pglite')
        mkdirSync(dataPath, { recursive: true })
        const pglite = new PGlite(dataPath)
        await bootstrapPglite(pglite)
        _db = drizzlePglite(pglite, { schema })
    } else {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is required in POSTGRES mode.')
        }
        const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
        _db = drizzlePg(pool, { schema })
    }

    return _db
}

/**
 * For tests: initialise the singleton with a caller-supplied PGlite instance
 * (typically `new PGlite()` for in-memory isolation).
 */
export async function initPgliteDb(pglite: PGlite): Promise<DrizzleDb> {
    await bootstrapPglite(pglite)
    _db = drizzlePglite(pglite, { schema })
    return _db
}

/** Reset singleton — only for tests. */
export function resetDb(): void {
    _db = null
}
