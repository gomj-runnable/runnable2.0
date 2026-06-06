// 테스트용 PostGIS 컨테이너 헬퍼.
// vitest globalSetup 에서 단일 컨테이너를 기동하고, 각 테스트는 truncateAll 로 격리한다.
import { execSync } from 'node:child_process'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import type { getDb } from '../database/client'

// 운영(compose/docker-compose.yml)과 동일한 PostGIS 이미지를 사용한다.
const POSTGIS_IMAGE = 'imresamu/postgis:17-3.5-alpine'

let container: StartedPostgreSqlContainer | null = null

/**
 * DOCKER_HOST 가 없으면 현재 docker context 의 엔드포인트로 보강한다.
 * colima·Docker Desktop·CI(docker.sock) 환경 모두에서 testcontainers 가 데몬을 찾도록 한다.
 */
function ensureDockerHost(): void {
    if (process.env.DOCKER_HOST) return
    try {
        const host = execSync('docker context inspect --format "{{.Endpoints.docker.Host}}"', {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim()
        if (host) process.env.DOCKER_HOST = host
    } catch {
        // docker CLI 부재/조회 실패 — testcontainers 기본 탐색에 맡긴다.
    }
}

/** PostGIS 컨테이너를 기동하고 연결 URI 를 반환한다. */
export async function startPostgisContainer(): Promise<string> {
    ensureDockerHost()
    // colima(sshfs) 등에서 Ryuk reaper 가 기동 로그를 못 내 hang 되는 문제를 회피한다.
    // 컨테이너 정리는 globalSetup teardown 의 stopPostgisContainer() 가 명시적으로 수행한다.
    process.env.TESTCONTAINERS_RYUK_DISABLED ??= 'true'
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start()
    return container.getConnectionUri()
}

/** 기동된 PostGIS 컨테이너를 정리한다. */
export async function stopPostgisContainer(): Promise<void> {
    await container?.stop()
    container = null
}

type Db = Awaited<ReturnType<typeof getDb>>

/**
 * public 스키마의 모든 테이블을 비운다 (테스트 간 격리).
 * drizzle 마이그레이션 메타테이블과 PostGIS 시스템 테이블은 제외한다.
 */
export async function truncateAll(db: Db): Promise<void> {
    await db.execute(sql`
        DO $$
        DECLARE r RECORD;
        BEGIN
            FOR r IN (
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
                  AND tablename NOT IN ('spatial_ref_sys', '__drizzle_migrations')
            ) LOOP
                EXECUTE format('TRUNCATE TABLE %I CASCADE', r.tablename);
            END LOOP;
        END $$;
    `)
}
