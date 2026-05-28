import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import type { drizzle } from 'drizzle-orm/pglite'
import { initPgliteDb, resetDb } from '../../database/client'
import { DrizzleUserFeaturePrefRepository } from '../userFeaturePref.repository.drizzle'
import { users } from '../../database/schema'
import type * as schema from '../../database/schema'

type PgliteDb = ReturnType<typeof drizzle<typeof schema>>

async function createFreshRepository(): Promise<{
    repo: DrizzleUserFeaturePrefRepository
    db: PgliteDb
}> {
    resetDb()
    const pglite = new PGlite()
    const db = (await initPgliteDb(pglite)) as PgliteDb
    return { repo: new DrizzleUserFeaturePrefRepository(db), db }
}

async function seedUser(db: PgliteDb, userId: string): Promise<void> {
    await db.insert(users).values({
        id: userId,
        name: userId,
        email: `${userId}@test.com`,
        emailVerified: false
    })
}

describe('DrizzleUserFeaturePrefRepository (PGlite in-memory)', () => {
    beforeEach(() => {
        resetDb()
    })
    afterEach(() => {
        resetDb()
    })

    describe('upsert', () => {
        it('새 pref 를 생성하고 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            const pref = await repo.upsert('u1', 'demo-coords', true)

            expect(pref).toEqual({ pluginId: 'demo-coords', enabled: true })
        })

        it('같은 (user, plugin) 이면 새 행을 만들지 않고 enabled 를 갱신한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            await repo.upsert('u1', 'demo-coords', true)
            await repo.upsert('u1', 'demo-coords', false)

            const list = await repo.findByUserId('u1')
            expect(list).toHaveLength(1)
            expect(list[0]!.enabled).toBe(false)
        })
    })

    describe('findByUserId', () => {
        it('해당 유저의 pref 만 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')
            await seedUser(db, 'u2')

            await repo.upsert('u1', 'p1', true)
            await repo.upsert('u2', 'p2', true)

            const u1 = await repo.findByUserId('u1')
            expect(u1).toHaveLength(1)
            expect(u1[0]!.pluginId).toBe('p1')
        })

        it('pref 가 없으면 빈 배열을 반환한다', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            expect(await repo.findByUserId('u1')).toEqual([])
        })
    })
})
