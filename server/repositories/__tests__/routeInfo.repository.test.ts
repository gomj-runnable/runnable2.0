import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest'
import { initTestDb, resetDb } from '../../database/client'
import { truncateAll } from '../../test/pgContainer'
import { DrizzleRouteInfoRepository } from '../routeInfo.repository.drizzle'
import { users, routes } from '../../database/schema'
import type { getDb } from '../../database/client'

type Db = Awaited<ReturnType<typeof getDb>>

let db: Db

beforeAll(async () => {
    db = await initTestDb(inject('databaseUrl'))
})

afterAll(() => {
    resetDb()
})

async function createFreshRepository(): Promise<{
    repo: DrizzleRouteInfoRepository
    db: Db
}> {
    await truncateAll(db)
    return { repo: new DrizzleRouteInfoRepository(db), db }
}

async function seedUserAndRoute(db: Db, userId: string, routeId: string): Promise<void> {
    await db.insert(users).values({
        id: userId,
        name: userId,
        email: `${userId}@test.com`,
        emailVerified: false
    })
    await db.insert(routes).values({
        routeId,
        userId,
        title: 'test route',
        description: 'desc',
        isPublic: false
    })
}

describe('DrizzleRouteInfoRepository (PostGIS)', () => {
    describe('create', () => {
        it('routeInfo 를 생성하고 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'u1', 'r1')

            const created = await repo.create({
                routeInfoId: 'ri1',
                routeId: 'r1',
                userId: 'u1',
                name: '한강 입구',
                description: '경로 시작점',
                lng: '126.978',
                lat: '37.5665',
                elevation: '50',
                authorName: '테스터'
            })

            expect(created.routeInfoId).toBe('ri1')
            expect(created.routeId).toBe('r1')
            expect(created.userId).toBe('u1')
            expect(created.name).toBe('한강 입구')
            expect(created.lng).toBe(126.978)
            expect(created.lat).toBe(37.5665)
            expect(created.elevation).toBe(50)
            expect(created.authorName).toBe('테스터')
            expect(created.createdAt).toBeTruthy()
        })

        it('elevation null 도 정상 처리한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'u1', 'r1')

            const created = await repo.create({
                routeInfoId: 'ri1',
                routeId: 'r1',
                userId: 'u1',
                name: 'X',
                description: 'Y',
                lng: '126',
                lat: '37',
                elevation: null,
                authorName: 'tester'
            })

            expect(created.elevation).toBeUndefined()
        })
    })

    describe('findByRouteId', () => {
        it('해당 routeId 의 routeInfo 들을 createdAt 오름차순으로 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'u1', 'r1')

            await repo.create({
                routeInfoId: 'ri1',
                routeId: 'r1',
                userId: 'u1',
                name: '첫번째',
                description: 'd1',
                lng: '126',
                lat: '37',
                elevation: null,
                authorName: 'a'
            })
            // 약간 시차를 두어 createdAt 순서가 명확하도록
            await new Promise((r) => setTimeout(r, 10))
            await repo.create({
                routeInfoId: 'ri2',
                routeId: 'r1',
                userId: 'u1',
                name: '두번째',
                description: 'd2',
                lng: '126',
                lat: '37',
                elevation: null,
                authorName: 'a'
            })

            const list = await repo.findByRouteId('r1')
            expect(list).toHaveLength(2)
            expect(list[0]!.routeInfoId).toBe('ri1')
            expect(list[1]!.routeInfoId).toBe('ri2')
        })

        it('다른 routeId 의 routeInfo 는 포함하지 않는다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'u1', 'r1')
            await seedUserAndRoute(db, 'u2', 'r2')

            await repo.create({
                routeInfoId: 'ri1',
                routeId: 'r1',
                userId: 'u1',
                name: 'r1 것',
                description: '',
                lng: '0',
                lat: '0',
                elevation: null,
                authorName: 'a'
            })
            await repo.create({
                routeInfoId: 'ri2',
                routeId: 'r2',
                userId: 'u2',
                name: 'r2 것',
                description: '',
                lng: '0',
                lat: '0',
                elevation: null,
                authorName: 'b'
            })

            const r1List = await repo.findByRouteId('r1')
            expect(r1List).toHaveLength(1)
            expect(r1List[0]!.routeInfoId).toBe('ri1')
        })

        it('routeId 가 없으면 빈 배열을 반환한다', async () => {
            const { repo } = await createFreshRepository()
            const list = await repo.findByRouteId('nonexistent')
            expect(list).toEqual([])
        })
    })
})
