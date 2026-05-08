import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import type { drizzle } from 'drizzle-orm/pglite'
import { initPgliteDb, resetDb } from '../../database/client'
import { DrizzleFacilityRepository } from '../facility.repository.drizzle'
import { facilities } from '../../database/schema/facilities'
import type * as schema from '../../database/schema'
import type { FacilityType } from '#shared/types/facility'

type PgliteDb = ReturnType<typeof drizzle<typeof schema>>

async function createFreshRepository(): Promise<{
    repo: DrizzleFacilityRepository
    db: PgliteDb
}> {
    resetDb()
    const pglite = new PGlite()
    const db = (await initPgliteDb(pglite)) as PgliteDb
    return { repo: new DrizzleFacilityRepository(db), db }
}

interface SeedFacility {
    id: string
    type: FacilityType
    name: string
    lat: number
    lng: number
}

async function seedFacilities(db: PgliteDb, items: SeedFacility[]): Promise<void> {
    for (const f of items) {
        await db.insert(facilities).values({
            id: f.id,
            type: f.type,
            name: f.name,
            lat: f.lat.toString(),
            lng: f.lng.toString()
        })
    }
}

// 서울 시청 (37.5665, 126.9780) 기준 좌표 묶음
const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }

describe('DrizzleFacilityRepository (PGlite in-memory)', () => {
    beforeEach(() => {
        resetDb()
    })
    afterEach(() => {
        resetDb()
    })

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

    describe('findNearby — bounding box + haversine', () => {
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

        it('극지방 좌표 — cos(lat)≈0 가드로 무한대 발생 안 함', async () => {
            const { repo, db } = await createFreshRepository()
            await seedFacilities(db, [
                { id: 'pole', type: 'toilet', name: '북극', lat: 89.999, lng: 0 }
            ])
            // lat = 90 → cos(lat) → 0. 가드 없으면 lngDelta = Infinity → SQL 비교 깨짐.
            // 가드 적용 시 정상 쿼리 + JS haversine 으로 정확한 거리 필터링.
            const result = await repo.findNearby(89.999, 0, 1000, ['toilet'])
            expect(result.map((f) => f.id)).toEqual(['pole'])
        })
    })
})
