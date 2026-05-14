import 'dotenv/config'

async function seed() {
    const { dbMode } = await import('../utils/config')
    const { getDb } = await import('./client')
    const { users, userAccounts } = await import('./schema/users')
    const { facilities } = await import('./schema/facilities')
    const { hashPassword } = await import('better-auth/crypto')
    const { sql } = await import('drizzle-orm')
    const { ROLES } = await import('../../shared/constants/roles')

    console.log(`🌱 Seed 작업 시작... (모드: ${dbMode})`)

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
                    set: { password: hashedAdminRolePassword }
                })
        })
        console.log('✅ 최고관리자 계정 설정 완료 (ID: ' + ADMIN_ROLE_ID + ')')

        // 2. developer 계정 (ROLES.DEVELOPER)
        // TODO. 정식 권한 체계 정립 시 이 시드와 ROLES.DEVELOPER 자체를 제거 검토.
        const DEV_ID = 'developer_master_01'
        const devData = {
            email: process.env.DEVELOPER_SEED_EMAIL ?? 'developer@runnable.com',
            password: developerPassword,
            name: 'developer'
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
                    set: { password: hashedDevPassword }
                })
        })
        console.log('✅ developer 계정 설정 완료 (ID: ' + DEV_ID + ')')

        // 3. 시설물 데이터 적재 (POSTGRES 전용 — PGlite는 PostGIS 미지원)
        if (dbMode === 'POSTGRES') {
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

            let totalInserted = 0
            for (const file of files) {
                const data = JSON.parse(readFileSync(resolve(dataDir, file), 'utf-8'))
                if (!data.length) continue

                const BATCH_SIZE = 500
                for (let i = 0; i < data.length; i += BATCH_SIZE) {
                    const batch = data.slice(i, i + BATCH_SIZE)
                    await db
                        .insert(facilities)
                        .values(
                            batch.map(
                                (f: {
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
                                }) => ({
                                    id: f.id,
                                    type: f.type,
                                    name: f.name,
                                    description: f.description ?? null,
                                    lng: f.lng.toString(),
                                    lat: f.lat.toString(),
                                    hours: f.hours ?? null,
                                    tel: f.tel ?? null,
                                    hasSignal: f.hasSignal ?? null,
                                    polyline: f.polyline ?? null
                                })
                            )
                        )
                        .onConflictDoUpdate({
                            target: facilities.id,
                            set: {
                                type: sql`excluded.type`,
                                name: sql`excluded.name`,
                                description: sql`excluded.description`,
                                lng: sql`excluded.lng`,
                                lat: sql`excluded.lat`,
                                hours: sql`excluded.hours`,
                                tel: sql`excluded.tel`,
                                hasSignal: sql`excluded.has_signal`,
                                polyline: sql`excluded.polyline`
                            }
                        })
                }
                totalInserted += data.length
                console.log(`  📦 ${file}: ${data.length}건`)
            }

            await db.execute(sql`
                ALTER TABLE facilities ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)
            `)
            await db.execute(sql`
                UPDATE facilities
                SET geom = ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)
                WHERE geom IS NULL
            `)
            await db.execute(sql`
                CREATE INDEX IF NOT EXISTS facility_geom_idx ON facilities USING GIST (geom)
            `)

            console.log(`✅ 시설물 데이터 적재 완료 (총 ${totalInserted}건)`)
        } else {
            console.log('ℹ️  PGLITE 모드: 시설물 데이터 적재 건너뜀 (PostGIS 미지원)')
        }
    } catch (error) {
        console.error('❌ Seed 작업 중 예외 발생:', error)
        process.exit(1)
    } finally {
        console.log('🏁 모든 작업 완료')
        process.exit(0)
    }
}

seed()
