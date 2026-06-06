import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest'
import { sql } from 'drizzle-orm'
import { initTestDb, resetDb } from '../../database/client'
import { truncateAll } from '../../test/pgContainer'
import { DrizzleFacilityRepository } from '../facility.repository'
import { facilities } from '../../database/schema/facilities'
import { crosswalkAttribute, toiletAttribute } from '../../database/schema/facilityAttributes'
import type { getDb } from '../../database/client'
import type { FacilityType } from '#shared/types/facility'

type Db = Awaited<ReturnType<typeof getDb>>

let db: Db

beforeAll(async () => {
    // initTestDb 가 마이그레이션을 적용하므로 PostGIS extension·geom 컬럼·종류별 테이블이 모두 준비된다.
    db = await initTestDb(inject('databaseUrl'))
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

/** facilities 기본행 + Point geom 적재 (lat/lng → geom). */
async function seedFacilities(db: Db, items: SeedFacility[]): Promise<void> {
    for (const f of items) {
        await db.insert(facilities).values({ id: f.id, type: f.type, name: f.name })
        await db.execute(sql`
            UPDATE facilities
            SET geom = ST_SetSRID(ST_MakePoint(${f.lng}, ${f.lat}), 4326)
            WHERE id = ${f.id}
        `)
    }
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

        it('모든 시설물을 geometry 와 함께 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'f1', type: 'toilet', name: '화장실 A', ...SEOUL_CITY_HALL },
                { id: 'f2', type: 'hospital', name: '병원 B', lat: 37.57, lng: 126.985 }
            ])
            const all = await repo.findAll()
            expect(all).toHaveLength(2)
            expect(all.map((f) => f.id).sort()).toEqual(['f1', 'f2'])
            const f1 = all.find((f) => f.id === 'f1')!
            expect(f1.geometry?.type).toBe('Point')
        })
    })

    describe('findNearby — ST_DWithin', () => {
        it('반경 내 시설물만 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'near', type: 'toilet', name: '근처', lat: 37.567, lng: 126.9785 }, // ~62m
                { id: 'far', type: 'toilet', name: '먼곳', lat: 37.6, lng: 127.0 } // ~4km+
            ])
            const result = await repo.findNearby(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng, 500, [
                'toilet'
            ])
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
    })

    describe('assemble — 종류별 속성 정규화', () => {
        it('crosswalk 의 has_signal 을 attributes 로 노출한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'cw1', type: 'crosswalk', name: '신호 횡단보도', ...SEOUL_CITY_HALL }
            ])
            await db.insert(crosswalkAttribute).values({ facilityId: 'cw1', hasSignal: true })

            const [facility] = await repo.findAll()
            expect(facility!.attributes).toEqual([
                { name: 'hasSignal', type: 'boolean', value: 'true' }
            ])
        })

        it('toilet 의 hours·tel 을 attributes 로 노출한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 't1', type: 'toilet', name: '화장실', ...SEOUL_CITY_HALL }
            ])
            await db
                .insert(toiletAttribute)
                .values({ facilityId: 't1', hours: '09:00~18:00', tel: '02-1234-5678' })

            const [facility] = await repo.findAll()
            expect(facility!.attributes).toEqual([
                { name: 'hours', type: 'string', value: '09:00~18:00' },
                { name: 'tel', type: 'string', value: '02-1234-5678' }
            ])
        })
    })
})
