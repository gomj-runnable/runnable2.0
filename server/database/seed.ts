// 초기 데이터 적재 스크립트 — 관리자 계정 및 시설물 데이터를 DB에 삽입한다
import 'dotenv/config'

async function seed() {
    const { getEnvMode, ENVIRONMENT_MODE } = await import('../config/envMode')
    if (getEnvMode() === ENVIRONMENT_MODE.PRODUCT && !process.env.ALLOW_PROD_SEED) {
        console.error('운영 환경에서 seed가 차단되었습니다. ALLOW_PROD_SEED=1 로 명시적 허용 필요.')
        process.exit(0)
    }

    const { getDb } = await import('./client')
    const { users, userAccounts } = await import('./schema/users')
    const { facilities } = await import('./schema/facilities')
    const { crosswalkAttribute, toiletAttribute, hospitalAttribute } =
        await import('./schema/facilityAttributes')
    const { hashPassword } = await import('better-auth/crypto')
    const { sql } = await import('drizzle-orm')
    const { ROLES } = await import('../../shared/constants/roles')

    console.log('🌱 Seed 작업 시작...')

    const adminPassword = process.env.ADMIN_SEED_PASSWORD
    if (!adminPassword) {
        console.error('ADMIN_SEED_PASSWORD env var is required.')
        process.exit(1)
    }

    const developerPassword = process.env.DEVELOPER_SEED_PASSWORD
    if (!developerPassword) {
        console.error('DEVELOPER_SEED_PASSWORD env var is required.')
        process.exit(1)
    }

    const db = await getDb()

    try {
        // 1. 최고관리자 계정 (ROLES.ADMIN)
        const ADMIN_ROLE_ID = 'admin_role_master_01'
        const adminRoleData = {
            email: process.env.ADMIN_SEED_EMAIL ?? 'admin@runnable.com',
            password: adminPassword,
            name: '최고관리자'
        }
        const hashedAdminRolePassword = await hashPassword(adminRoleData.password)

        await db.transaction(async (tx) => {
            await tx
                .insert(users)
                .values({
                    id: ADMIN_ROLE_ID,
                    name: adminRoleData.name,
                    email: adminRoleData.email,
                    role: ROLES.ADMIN,
                    emailVerified: true
                })
                .onConflictDoUpdate({
                    target: users.id,
                    set: {
                        email: adminRoleData.email,
                        name: adminRoleData.name,
                        role: ROLES.ADMIN
                    }
                })

            await tx
                .insert(userAccounts)
                .values({
                    id: `acc_${ADMIN_ROLE_ID}`,
                    userId: ADMIN_ROLE_ID,
                    accountId: adminRoleData.email,
                    providerId: 'credential',
                    password: hashedAdminRolePassword
                })
                .onConflictDoUpdate({
                    target: userAccounts.id,
                    set: {
                        accountId: adminRoleData.email,
                        password: hashedAdminRolePassword
                    }
                })
        })
        console.log('✅ 최고관리자 계정 설정 완료 (ID: ' + ADMIN_ROLE_ID + ')')

        // 2. developer 계정 (ROLES.DEVELOPER)
        // TODO. 정식 권한 체계 정립 시 이 시드와 ROLES.DEVELOPER 자체를 제거 검토.
        const DEV_ID = 'developer_master_01'
        const devData = {
            email: process.env.DEVELOPER_SEED_EMAIL ?? 'develop@runnable.com',
            password: developerPassword,
            name: 'develop'
        }
        const hashedDevPassword = await hashPassword(devData.password)

        await db.transaction(async (tx) => {
            await tx
                .insert(users)
                .values({
                    id: DEV_ID,
                    name: devData.name,
                    email: devData.email,
                    role: ROLES.DEVELOPER,
                    emailVerified: true
                })
                .onConflictDoUpdate({
                    target: users.id,
                    set: {
                        email: devData.email,
                        name: devData.name,
                        role: ROLES.DEVELOPER
                    }
                })

            await tx
                .insert(userAccounts)
                .values({
                    id: `acc_${DEV_ID}`,
                    userId: DEV_ID,
                    accountId: devData.email,
                    providerId: 'credential',
                    password: hashedDevPassword
                })
                .onConflictDoUpdate({
                    target: userAccounts.id,
                    set: {
                        accountId: devData.email,
                        password: hashedDevPassword
                    }
                })
        })
        console.log('✅ developer 계정 설정 완료 (ID: ' + DEV_ID + ')')

        // 3. 시설물 데이터 적재 (PostGIS)
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`)

        const { readFileSync } = await import('node:fs')
        const { resolve } = await import('node:path')

        const dataDir = resolve(import.meta.dirname, '../data/facilities')
        const files = [
            'hospitals.json',
            'toilets.json',
            'fountains.json',
            'lockers.json',
            'crosswalks.json'
        ]

        // geom 컬럼/인덱스 보장 (마이그레이션 0008 과 동일 — 미적용 환경 대비 방어적).
        await db.execute(
            sql`ALTER TABLE facilities ADD COLUMN IF NOT EXISTS geom geometry(Geometry, 4326)`
        )
        await db.execute(
            sql`CREATE INDEX IF NOT EXISTS facility_geom_idx ON facilities USING GIST (geom)`
        )

        interface FacilityJson {
            id: string
            type: string
            name: string
            description?: string
            lng: number
            lat: number
            hours?: string
            tel?: string
            hasSignal?: boolean
            polyline?: [number, number][]
        }

        let totalInserted = 0
        for (const file of files) {
            const raw = JSON.parse(readFileSync(resolve(dataDir, file), 'utf-8')) as FacilityJson[]
            if (!raw.length) continue
            // 배치 내 중복 ID 제거 (마지막 항목 우선)
            const seen = new Map<string, number>()
            for (let i = 0; i < raw.length; i++) seen.set(raw[i]!.id, i)
            const data = [...seen.values()].map((i) => raw[i]!)

            const BATCH_SIZE = 500
            for (let i = 0; i < data.length; i += BATCH_SIZE) {
                const batch = data.slice(i, i + BATCH_SIZE)

                // 1) 기본 시설 행 (id/type/name/description)
                await db
                    .insert(facilities)
                    .values(
                        batch.map((f) => ({
                            id: f.id,
                            type: f.type,
                            name: f.name,
                            description: f.description ?? null
                        }))
                    )
                    .onConflictDoUpdate({
                        target: facilities.id,
                        set: {
                            type: sql`excluded.type`,
                            name: sql`excluded.name`,
                            description: sql`excluded.description`
                        }
                    })

                // 2) 종류별 속성 — crosswalk(has_signal) / toilet·hospital(hours, tel)
                const crosswalkRows = batch
                    .filter((f) => f.type === 'crosswalk')
                    .map((f) => ({ facilityId: f.id, hasSignal: f.hasSignal ?? null }))
                if (crosswalkRows.length) {
                    await db
                        .insert(crosswalkAttribute)
                        .values(crosswalkRows)
                        .onConflictDoUpdate({
                            target: crosswalkAttribute.facilityId,
                            set: { hasSignal: sql`excluded.has_signal` }
                        })
                }

                const toiletRows = batch
                    .filter((f) => f.type === 'toilet')
                    .map((f) => ({ facilityId: f.id, hours: f.hours ?? null, tel: f.tel ?? null }))
                if (toiletRows.length) {
                    await db
                        .insert(toiletAttribute)
                        .values(toiletRows)
                        .onConflictDoUpdate({
                            target: toiletAttribute.facilityId,
                            set: { hours: sql`excluded.hours`, tel: sql`excluded.tel` }
                        })
                }

                const hospitalRows = batch
                    .filter((f) => f.type === 'hospital')
                    .map((f) => ({ facilityId: f.id, hours: f.hours ?? null, tel: f.tel ?? null }))
                if (hospitalRows.length) {
                    await db
                        .insert(hospitalAttribute)
                        .values(hospitalRows)
                        .onConflictDoUpdate({
                            target: hospitalAttribute.facilityId,
                            set: { hours: sql`excluded.hours`, tel: sql`excluded.tel` }
                        })
                }

                // 3) geom — polyline(횡단보도)은 LineString, 그 외는 Point
                for (const f of batch) {
                    const geomExpr =
                        f.polyline && f.polyline.length >= 2
                            ? sql`ST_SetSRID(ST_GeomFromText(${`LINESTRING(${f.polyline
                                  .map(([x, y]) => `${x} ${y}`)
                                  .join(', ')})`}), 4326)`
                            : sql`ST_SetSRID(ST_MakePoint(${f.lng}, ${f.lat}), 4326)`
                    await db.execute(
                        sql`UPDATE facilities SET geom = ${geomExpr} WHERE id = ${f.id}`
                    )
                }
            }
            totalInserted += data.length
            console.log(`  📦 ${file}: ${data.length}건`)
        }

        console.log(`✅ 시설물 데이터 적재 완료 (총 ${totalInserted}건)`)
    } catch (error) {
        console.error('❌ Seed 작업 중 예외 발생:', error)
        process.exit(1)
    } finally {
        console.log('🏁 모든 작업 완료')
        process.exit(0)
    }
}

seed()
