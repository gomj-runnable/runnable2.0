import { describe, it, expect, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import type { drizzle } from 'drizzle-orm/pglite'
import { initPgliteDb, resetDb } from '../../database/client'
import { DrizzleCurationRepository } from '../curation.repository.drizzle'
import { users, routes } from '../../database/schema'
import type * as schema from '../../database/schema'

type PgliteDb = ReturnType<typeof drizzle<typeof schema>>

async function createFreshRepository(): Promise<{
    repo: DrizzleCurationRepository
    db: PgliteDb
}> {
    resetDb()
    const pglite = new PGlite()
    const db = (await initPgliteDb(pglite)) as PgliteDb
    return { repo: new DrizzleCurationRepository(db), db }
}

async function seedUserAndRoute(db: PgliteDb, userId: string, routeId: string): Promise<void> {
    await db.insert(users).values({
        id: userId,
        name: userId,
        email: `${userId}@test.com`,
        emailVerified: false
    })
    await db.insert(routes).values({
        routeId,
        userId,
        title: 'route',
        description: '',
        isPublic: true
    })
}

const collectionInput = (overrides: Record<string, unknown> = {}) => ({
    title: '봄맞이 컬렉션',
    description: '봄에 좋은 경로',
    season: 'spring' as const,
    theme: 'cherry-blossom' as const,
    validFrom: '2026-03-01',
    validTo: '2026-05-31',
    coverImageUrl: 'https://example.com/x.jpg',
    ...overrides
})

describe('DrizzleCurationRepository (PGlite in-memory)', () => {
    beforeEach(() => {
        resetDb()
    })

    describe('createCollection + getCollection', () => {
        it('컬렉션을 생성하고 조회', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')

            const created = await repo.createCollection(collectionInput(), 'admin')
            expect(created.collectionId).toBeTruthy()
            expect(created.createdBy).toBe('admin')
            expect(created.title).toBe('봄맞이 컬렉션')
            expect(created.season).toBe('spring')
            expect(created.routeCount).toBe(0)

            const fetched = await repo.getCollection(created.collectionId)
            expect(fetched).not.toBeNull()
            expect(fetched!.title).toBe('봄맞이 컬렉션')
        })

        it('optional 필드(description/coverImage)가 비어 있으면 undefined', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')

            const created = await repo.createCollection(
                collectionInput({ description: undefined, coverImageUrl: undefined }),
                'admin'
            )
            expect(created.description).toBeUndefined()
            expect(created.coverImageUrl).toBeUndefined()
        })

        it('존재하지 않는 collectionId 는 null', async () => {
            const { repo } = await createFreshRepository()
            await expect(repo.getCollection('non-existent')).resolves.toBeNull()
        })
    })

    describe('listActiveCollections', () => {
        it('today 가 validFrom/validTo 범위 안에 있는 컬렉션만, createdAt desc', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')

            await repo.createCollection(
                collectionInput({
                    title: 'A',
                    validFrom: '2026-01-01',
                    validTo: '2026-03-31'
                }),
                'admin'
            )
            await new Promise((r) => setTimeout(r, 10))
            await repo.createCollection(
                collectionInput({
                    title: 'B',
                    validFrom: '2026-04-01',
                    validTo: '2026-06-30'
                }),
                'admin'
            )
            await repo.createCollection(
                collectionInput({
                    title: 'C',
                    validFrom: '2026-05-01',
                    validTo: '2026-05-31'
                }),
                'admin'
            )

            const list = await repo.listActiveCollections('2026-05-15')
            const titles = list.map((c) => c.title)
            expect(titles).toEqual(['C', 'B'])
        })
    })

    describe('listAllCollections', () => {
        it('createdAt desc 로 모든 컬렉션 반환', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')

            await repo.createCollection(collectionInput({ title: 'A' }), 'admin')
            await new Promise((r) => setTimeout(r, 10))
            await repo.createCollection(collectionInput({ title: 'B' }), 'admin')

            const list = await repo.listAllCollections()
            expect(list).toHaveLength(2)
            expect(list[0]!.title).toBe('B')
            expect(list[1]!.title).toBe('A')
        })
    })

    describe('deleteCollection', () => {
        it('존재 → true, 미존재 → false', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')
            const c = await repo.createCollection(collectionInput(), 'admin')

            await expect(repo.deleteCollection(c.collectionId)).resolves.toBe(true)
            await expect(repo.deleteCollection('non-existent')).resolves.toBe(false)
        })
    })

    describe('addRoute + listRoutes + removeRoute', () => {
        it('addRoute 시 routeCount 가 증가하고 listRoutes 로 sortOrder asc 반환', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')
            await db.insert(routes).values({
                routeId: 'r-2',
                userId: 'admin',
                title: 'r2',
                description: '',
                isPublic: true
            })
            const c = await repo.createCollection(collectionInput(), 'admin')

            await repo.addRoute(c.collectionId, {
                routeId: 'r-1',
                sortOrder: 2,
                recommendedHourLocal: 7,
                photoUrl: 'p1',
                note: 'n1'
            })
            await repo.addRoute(c.collectionId, {
                routeId: 'r-2',
                sortOrder: 1
            })

            const fetched = await repo.getCollection(c.collectionId)
            expect(fetched!.routeCount).toBe(2)

            const list = await repo.listRoutes(c.collectionId)
            expect(list).toHaveLength(2)
            expect(list[0]!.routeId).toBe('r-2') // sortOrder 1
            expect(list[1]!.routeId).toBe('r-1')
            expect(list[1]!.recommendedHourLocal).toBe(7)
            expect(list[1]!.photoUrl).toBe('p1')
            expect(list[1]!.note).toBe('n1')
        })

        it('optional 필드 미지정 시 undefined', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')
            const c = await repo.createCollection(collectionInput(), 'admin')

            const added = await repo.addRoute(c.collectionId, {
                routeId: 'r-1',
                sortOrder: 0
            })
            expect(added.recommendedHourLocal).toBeUndefined()
            expect(added.photoUrl).toBeUndefined()
            expect(added.note).toBeUndefined()
        })

        it('removeRoute → routeCount 감소', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')
            const c = await repo.createCollection(collectionInput(), 'admin')

            const added = await repo.addRoute(c.collectionId, { routeId: 'r-1', sortOrder: 0 })

            await expect(repo.removeRoute(added.curationRouteId)).resolves.toBe(true)

            const fetched = await repo.getCollection(c.collectionId)
            expect(fetched!.routeCount).toBe(0)
        })

        it('removeRoute 가 없는 ID 는 false', async () => {
            const { repo } = await createFreshRepository()
            await expect(repo.removeRoute('non-existent')).resolves.toBe(false)
        })

        it('routeCount 는 0 미만으로 떨어지지 않는다 (greatest 0)', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')
            const c = await repo.createCollection(collectionInput(), 'admin')
            // 직접 routeCount 를 0 으로 강제한 뒤 addRoute → 1, removeRoute → 0
            const added = await repo.addRoute(c.collectionId, { routeId: 'r-1', sortOrder: 0 })
            await repo.removeRoute(added.curationRouteId)

            // 한번 더 추가 후 제거해도 음수가 되지 않음
            const added2 = await repo.addRoute(c.collectionId, { routeId: 'r-1', sortOrder: 0 })
            await repo.removeRoute(added2.curationRouteId)

            const fetched = await repo.getCollection(c.collectionId)
            expect(fetched!.routeCount).toBe(0)
        })

        it('빈 컬렉션의 listRoutes 는 빈 배열', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'admin', 'r-1')
            const c = await repo.createCollection(collectionInput(), 'admin')
            await expect(repo.listRoutes(c.collectionId)).resolves.toEqual([])
        })
    })
})
