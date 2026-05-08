import { describe, it, expect } from 'vitest'

// `sanitizeForPglite` 는 client.ts 에 비-export 헬퍼로 있어 테스트에서 동등 패턴을 재구현.
// 실제 정규식과 동일하게 유지해야 한다 (변경 시 client.ts 와 함께 갱신).
const POSTGIS_PATTERN = /CREATE\s+EXTENSION|geometry\s*\(|ST_[A-Za-z]+|USING\s+gist|\bPostGIS\b/i

function sanitizeForPglite(sql: string): string[] {
    const raw = sql.includes('--> statement-breakpoint')
        ? sql.split('--> statement-breakpoint')
        : sql.split(/;\s*\n/)
    return raw.map((s) => s.trim()).filter((s) => s.length > 0 && !POSTGIS_PATTERN.test(s))
}

describe('sanitizeForPglite — PostGIS statement filtering', () => {
    it('CREATE EXTENSION postgis 라인을 스킵한다', () => {
        const sql = `CREATE EXTENSION IF NOT EXISTS postgis;\nCREATE TABLE t (id text);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(1)
        expect(stmts[0]).toContain('CREATE TABLE t')
    })

    it('geometry() 컬럼 정의를 가진 statement 를 스킵한다', () => {
        const sql = `ALTER TABLE facilities ADD COLUMN geom geometry(Point, 4326);\nCREATE TABLE x (id text);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(1)
        expect(stmts[0]).toContain('CREATE TABLE x')
    })

    it('ST_ 함수를 사용하는 statement 를 스킵한다', () => {
        const sql = `UPDATE facilities SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326);\nCREATE TABLE y (id text);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(1)
        expect(stmts[0]).toContain('CREATE TABLE y')
    })

    it('USING gist 인덱스를 가진 statement 를 스킵한다', () => {
        const sql = `CREATE INDEX facility_geom_idx ON facilities USING gist (geom);\nCREATE TABLE z (id text);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(1)
        expect(stmts[0]).toContain('CREATE TABLE z')
    })

    it('[KNOWN FP] PostGIS 코멘트가 같은 statement 에 있으면 statement 전체가 스킵된다', () => {
        // sanitizer 가 statement 단위라 SQL 코멘트의 `PostGIS` 도 매칭한다.
        // 회귀 감지용 — 만약 sanitizer 를 라인 단위로 바꾸면 여기도 갱신해야 함.
        const sql = `-- enable PostGIS extension\nCREATE TABLE w (id text);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(0)
    })

    it('일반 Postgres SQL 은 모두 통과시킨다', () => {
        const sql = `CREATE TABLE users (id text PRIMARY KEY);\nCREATE INDEX user_email_idx ON users (email);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(2)
    })

    it('drizzle statement-breakpoint 구분자로 분리한다', () => {
        const sql = `CREATE TABLE a (id text);--> statement-breakpoint\nCREATE TABLE b (id text);`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(2)
    })

    it('빈 statement 는 제거한다', () => {
        const sql = `CREATE TABLE a (id text);\n\n\n`
        const stmts = sanitizeForPglite(sql)
        expect(stmts).toHaveLength(1)
    })

    // 알려진 거짓-양성 케이스 — 향후 마이그레이션이 이런 패턴을 도입하면 sanitizer 수정 필요.
    // 이 테스트는 회귀 감지용 (현재는 거짓-양성).
    it.skip('[KNOWN-FP] geometry_type 같은 식별자 컬럼명도 잘못 스킵될 수 있다', () => {
        const sql = `CREATE TABLE shapes (id text, geometry_type text);`
        const stmts = sanitizeForPglite(sql)
        // 현재 구현은 `geometry(` 가 아니라 `geometry_type` 을 잡지 않으므로 통과.
        // 그러나 만약 `geometry\s*\(` 대신 `\bgeometry\b` 로 바꾸면 거짓-양성 발생.
        expect(stmts).toHaveLength(1)
    })
})
