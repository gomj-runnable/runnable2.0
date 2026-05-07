import 'dotenv/config'

async function seed() {
    if (process.env.USE_DATABASE_MODE === 'MEMORY') {
        console.log('MEMORY 모드에서는 seed를 실행하지 않습니다.')
        process.exit(0)
    }

    const { db } = await import('../utils/db')
    const { users, userAccounts } = await import('./schema/users')
    const { facilities } = await import('./schema/facilities')
    const { hashPassword } = await import('better-auth/crypto')
    const { sql } = await import('drizzle-orm')
    const { ROLES } = await import('../../shared/constants/roles')

    console.log('🌱 Seed 작업 시작...')

    const adminPassword = process.env.ADMIN_SEED_PASSWORD
    if (!adminPassword) {
        console.error('ADMIN_SEED_PASSWORD env var is required.')
        process.exit(1)
    }

    // TODO. 다이어그램 스튜디오 dev 백도어 — prod에서도 developer 계정으로 접근 가능.
    //       정식 권한 체계 정립 시 이 시드와 ROLES.DEVELOPER 자체를 제거 검토.
    const developerPassword = process.env.DEVELOPER_SEED_PASSWORD
    if (!developerPassword) {
        console.error('DEVELOPER_SEED_PASSWORD env var is required.')
        process.exit(1)
    }

    const ADMIN_ID = 'admin_master_01'
    const adminData = {
        email: 'admin@runnable.local',
        password: adminPassword,
        name: '최고관리자'
    }

    if (!db) {
        console.error('DB 연결 실패: db가 null입니다.')
        process.exit(1)
    }

    try {
        // 1. 관리자 계정 생성 (Upsert 방식: 있으면 업데이트, 없으면 삽입)
        const hashedPassword = await hashPassword(adminData.password)

        await db.transaction(async (tx) => {
            // 1-1. users 테이블 (id 기준 중복 체크)
            await tx
                .insert(users)
                .values({
                    id: ADMIN_ID,
                    name: adminData.name,
                    email: adminData.email,
                    role: 10,
                    emailVerified: true
                })
                .onConflictDoUpdate({
                    target: users.id, // ID가 겹치면
                    set: { email: adminData.email, name: adminData.name, role: 10 } // 정보를 최신화
                })

            // 1-2. user_accounts 테이블 (userId 기준 중복 체크)
            await tx
                .insert(userAccounts)
                .values({
                    id: `acc_${ADMIN_ID}`,
                    userId: ADMIN_ID,
                    accountId: adminData.email,
                    providerId: 'credential',
                    password: hashedPassword
                })
                .onConflictDoUpdate({
                    target: userAccounts.id,
                    set: { password: hashedPassword } // 비밀번호 변경 시 반영
                })
        })
        console.log('✅ 관리자 계정 설정 완료 (ID: ' + ADMIN_ID + ')')

        // developer 계정 생성 (ROLES.DEVELOPER, email 기반 — username 플러그인 미사용)
        const DEV_ID = 'developer_master_01'
        const devData = {
            email: 'developer@runnable.com',
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
                .onConflictDoNothing({ target: users.id })

            await tx
                .insert(userAccounts)
                .values({
                    id: `acc_${DEV_ID}`,
                    userId: DEV_ID,
                    accountId: devData.email,
                    providerId: 'credential',
                    password: hashedDevPassword
                })
                .onConflictDoNothing({ target: userAccounts.id })
        })
        console.log('✅ developer 계정 설정 완료 (ID: ' + DEV_ID + ')')

        // 2. 시설물 데���터 적재
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

            // 500건씩 배치 insert
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

        // geom 컬럼 일괄 업데이트
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
    } catch (error) {
        console.error('❌ Seed 작업 중 예외 발생:', error)
        process.exit(1)
    } finally {
        console.log('🏁 모든 작업 완료')
        process.exit(0)
    }
}

seed()
