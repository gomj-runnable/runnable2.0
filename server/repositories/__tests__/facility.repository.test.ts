import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest'
import { sql } from 'drizzle-orm'
import { initTestDb, resetDb } from '../../database/client'
import { truncateAll } from '../../test/pgContainer'
import { DrizzleFacilityRepository } from '../facility.repository'
import { facilities } from '../../database/schema/facilities'
import type { getDb } from '../../database/client'
import type { FacilityType } from '#shared/types/facility'

type Db = Awaited<ReturnType<typeof getDb>>

let db: Db

beforeAll(async () => {
    db = await initTestDb(inject('databaseUrl'))
    // 마이그레이션에는 PostGIS/geom 이 없다 — seed.ts 와 동일하게 런타임에 셋업한다.
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`)
    await db.execute(
        sql`ALTER TABLE facilities ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)`
    )
    await db.execute(
        sql`CREATE INDEX IF NOT EXISTS facility_geom_idx ON facilities USING GIST (geom)`
    )
})

afterAll(() => {
    resetDb()
})

async function createFreshRepository(): Promise<{
    repo: DrizzleFacilityRepository
    db: Db
}> {
    await truncateAll(db)
    return { repo: new DrizzleFacilityRepository(db), db }
}

interface SeedFacility {
    id: string
    type: FacilityType
    name: string
    lat: number
    lng: number
}

async function seedFacilities(db: Db, items: SeedFacility[]): Promise<void> {
    for (const f of items) {
        await db.insert(facilities).values({
            id: f.id,
            type: f.type,
            name: f.name,
            lat: f.lat.toString(),
            lng: f.lng.toString()
        })
    }
    // findNearby 는 geom 컬럼으로 PostGIS 쿼리하므로 lat/lng 로부터 geom 을 채운다.
    await db.execute(sql`
        UPDATE facilities
        SET geom = ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)
        WHERE geom IS NULL
    `)
}

// 서울 시청 (37.5665, 126.9780) 기준 좌표 묶음
const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }

describe('DrizzleFacilityRepository (PostGIS)', () => {
    describe('findAll', () => {
        it('빈 테이블에서 빈 배열을 반환한다', async () => {
            const { repo } = await createFreshRepository()
            const all = await repo.findAll()
            expect(all).toEqual([])
        })

        it('모든 시설물을 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'f1', type: 'toilet', name: '화장실 A', ...SEOUL_CITY_HALL },
                {
                    id: 'f2',
                    type: 'hospital',
                    name: '병원 B',
                    lat: 37.57,
                    lng: 126.985
                }
            ])
            const all = await repo.findAll()
            expect(all).toHaveLength(2)
            expect(all.map((f) => f.id).sort()).toEqual(['f1', 'f2'])
        })
    })

    describe('findNearby — ST_DWithin', () => {
        it('반경 내 시설물만 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'near', type: 'toilet', name: '근처', lat: 37.567, lng: 126.9785 }, // ~62m
                { id: 'far', type: 'toilet', name: '먼곳', lat: 37.6, lng: 127.0 } // ~4km+
            ])
            const result = await repo.findNearby(
                SEOUL_CITY_HALL.lat,
                SEOUL_CITY_HALL.lng,
                500, // 500m 반경
                ['toilet']
            )
            expect(result.map((f) => f.id)).toEqual(['near'])
        })

        it('타입 필터링이 동작한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 't1', type: 'toilet', name: '화장실', ...SEOUL_CITY_HALL },
                { id: 'h1', type: 'hospital', name: '병원', ...SEOUL_CITY_HALL }
            ])
            const result = await repo.findNearby(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng, 100, [
                'hospital'
            ])
            expect(result.map((f) => f.id)).toEqual(['h1'])
        })

        it('거리 오름차순으로 정렬된다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'mid', type: 'toilet', name: '중간', lat: 37.568, lng: 126.979 },
                { id: 'closest', type: 'toilet', name: '가장가까움', ...SEOUL_CITY_HALL },
                { id: 'farther', type: 'toilet', name: '약간먼곳', lat: 37.57, lng: 126.981 }
            ])
            const result = await repo.findNearby(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng, 10_000, [
                'toilet'
            ])
            expect(result.map((f) => f.id)).toEqual(['closest', 'mid', 'farther'])
        })

        it('빈 결과를 반환할 수 있다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'distant', type: 'toilet', name: '저먼곳', lat: 38.0, lng: 128.0 }
            ])
            const result = await repo.findNearby(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng, 100, [
                'toilet'
            ])
            expect(result).toEqual([])
        })

        it('극지방 좌표에서도 정상 동작한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'pole', type: 'toilet', name: '북극', lat: 89.999, lng: 0 }
            ])
            // geography 기반 ST_DWithin 은 극지방에서도 정확한 거리를 계산한다.
            const result = await repo.findNearby(89.999, 0, 1000, ['toilet'])
            expect(result.map((f) => f.id)).toEqual(['pole'])
        })
    })
})
