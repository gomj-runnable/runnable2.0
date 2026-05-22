import { describe, it, expect, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import type { drizzle } from 'drizzle-orm/pglite'
import { initPgliteDb, resetDb } from '../../database/client'
import { DrizzleSegmentRepository } from '../segment.repository.drizzle'
import { users, routes } from '../../database/schema'
import type * as schema from '../../database/schema'

type PgliteDb = ReturnType<typeof drizzle<typeof schema>>

async function createFreshRepository(): Promise<{
    repo: DrizzleSegmentRepository
    db: PgliteDb
}> {
    resetDb()
    const pglite = new PGlite()
    const db = (await initPgliteDb(pglite)) as PgliteDb
    return { repo: new DrizzleSegmentRepository(db), db }
}

async function seedUserAndRoute(
    db: PgliteDb,
    userId: string,
    routeId: string,
    userName?: string
): Promise<void> {
    await db.insert(users).values({
        id: userId,
        name: userName ?? userId,
        email: `${userId}@test.com`,
        emailVerified: false
    })
    await db.insert(routes).values({
        routeId,
        userId,
        title: 'route',
        description: 'd',
        isPublic: true
    })
}

const segInput = (overrides: Record<string, unknown> = {}) => ({
    name: '한강 6km',
    description: '평지',
    routeId: 'r-1',
    startPositionIndex: 0,
    endPositionIndex: 100,
    distanceKm: 6.0,
    elevationGainM: 12,
    isPublic: true,
    ...overrides
})

describe('DrizzleSegmentRepository (PGlite in-memory)', () => {
    beforeEach(() => {
        resetDb()
    })

    describe('createSegment + getSegment', () => {
        it('segment 생성 후 getSegment 로 조회 (ownerName join)', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1', '러너1')

            const created = await repo.createSegment(segInput(), 'owner')
            expect(created.segmentId).toBeTruthy()
            expect(created.ownerId).toBe('owner')
            expect(created.distanceKm).toBeCloseTo(6.0, 3)
            expect(created.elevationGainM).toBeCloseTo(12, 2)
            expect(created.isPublic).toBe(true)
            expect(created.effortCount).toBe(0)

            const fetched = await repo.getSegment(created.segmentId)
            expect(fetched).not.toBeNull()
            expect(fetched!.ownerName).toBe('러너1')
        })

        it('elevationGainM 미지정 시 undefined', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')

            const created = await repo.createSegment(
                segInput({ elevationGainM: undefined }),
                'owner'
            )
            expect(created.elevationGainM).toBeUndefined()
        })

        it('isPublic 기본값 true', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            const created = await repo.createSegment(segInput({ isPublic: undefined }), 'owner')
            expect(created.isPublic).toBe(true)
        })

        it('존재하지 않는 segmentId 는 null', async () => {
            const { repo } = await createFreshRepository()
            await expect(repo.getSegment('non-existent')).resolves.toBeNull()
        })
    })

    describe('list 메서드', () => {
        it('listPublicSegments — isPublic=true 만, effortCount desc', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')

            const s1 = await repo.createSegment(segInput({ name: 'A' }), 'owner')
            const s2 = await repo.createSegment(segInput({ name: 'B' }), 'owner')
            await repo.createSegment(segInput({ name: 'C', isPublic: false }), 'owner')

            // s2 에 effort 2건, s1 에 1건
            await db.insert(users).values({
                id: 'r-user',
                name: 'r',
                email: 'r@test.com',
                emailVerified: false
            })
            await repo.createEffort(
                { segmentId: s1.segmentId, durationSec: 100, paceSecPerKm: 200 },
                'r-user'
            )
            await repo.createEffort(
                { segmentId: s2.segmentId, durationSec: 90, paceSecPerKm: 180 },
                'r-user'
            )
            await repo.createEffort(
                { segmentId: s2.segmentId, durationSec: 95, paceSecPerKm: 190 },
                'r-user'
            )

            const list = await repo.listPublicSegments()
            expect(list).toHaveLength(2)
            expect(list[0]!.name).toBe('B')
            expect(list[0]!.effortCount).toBe(2)
            expect(list[1]!.effortCount).toBe(1)
        })

        it('listSegmentsByRoute — routeId 필터, createdAt desc', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            await db.insert(routes).values({
                routeId: 'r-2',
                userId: 'owner',
                title: 'r2',
                description: '',
                isPublic: true
            })

            await repo.createSegment(segInput({ routeId: 'r-1', name: 'A' }), 'owner')
            await new Promise((r) => setTimeout(r, 10))
            await repo.createSegment(segInput({ routeId: 'r-1', name: 'B' }), 'owner')
            await repo.createSegment(segInput({ routeId: 'r-2', name: 'C' }), 'owner')

            const list = await repo.listSegmentsByRoute('r-1')
            expect(list).toHaveLength(2)
            expect(list[0]!.name).toBe('B')
            expect(list[1]!.name).toBe('A')
        })

        it('listSegmentsByOwner — 같은 owner 만 createdAt desc', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner1', 'r-1')
            await seedUserAndRoute(db, 'owner2', 'r-2')

            await repo.createSegment(segInput({ name: 'A' }), 'owner1')
            await repo.createSegment(segInput({ routeId: 'r-2', name: 'B' }), 'owner2')

            const list = await repo.listSegmentsByOwner('owner1')
            expect(list).toHaveLength(1)
            expect(list[0]!.name).toBe('A')
        })
    })

    describe('deleteSegment', () => {
        it('존재 → true, 미존재 → false', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            const created = await repo.createSegment(segInput(), 'owner')

            await expect(repo.deleteSegment(created.segmentId)).resolves.toBe(true)
            await expect(repo.deleteSegment('non-existent')).resolves.toBe(false)
        })
    })

    describe('createEffort + effortCount 증가', () => {
        it('createEffort 호출 시 segment.effortCount 가 1 증가', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            await db.insert(users).values({
                id: 'runner',
                name: 'runner',
                email: 'runner@test.com',
                emailVerified: false
            })
            const seg = await repo.createSegment(segInput(), 'owner')

            const effort = await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 1200, paceSecPerKm: 200 },
                'runner'
            )
            expect(effort.effortId).toBeTruthy()
            expect(effort.userId).toBe('runner')

            const fetched = await repo.getSegment(seg.segmentId)
            expect(fetched!.effortCount).toBe(1)
        })
    })

    describe('getLeaderboard', () => {
        it('segment 없으면 빈 leaderboard', async () => {
            const { repo } = await createFreshRepository()
            const lb = await repo.getLeaderboard('non-existent')
            expect(lb.totalEfforts).toBe(0)
            expect(lb.top).toEqual([])
            expect(lb.userRank).toBeNull()
        })

        it('top N 정렬 + userId 지정 시 본인 best/rank', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1', 'owner-name')
            await db.insert(users).values({
                id: 'u1',
                name: 'u1',
                email: 'u1@test.com',
                emailVerified: false
            })
            await db.insert(users).values({
                id: 'u2',
                name: 'u2',
                email: 'u2@test.com',
                emailVerified: false
            })
            const seg = await repo.createSegment(segInput(), 'owner')

            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 100, paceSecPerKm: 200 },
                'u1'
            )
            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 90, paceSecPerKm: 180 },
                'u2'
            )
            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 120, paceSecPerKm: 240 },
                'u1'
            )

            const lb = await repo.getLeaderboard(seg.segmentId, 'u1', 10)
            expect(lb.totalEfforts).toBe(3)
            // top 첫번째는 가장 빠른 시간 (90)
            expect(lb.top[0]!.durationSec).toBe(90)
            // u1 best = 100 (자기 best 만)
            expect(lb.userBest!.durationSec).toBe(100)
            // rank = (90 보다 빠른 효 카운트) + 1 = 0+1 = 1? — 실제로는 u2 의 90 이 u1 best(100) 보다 빠르므로 rank=2
            expect(lb.userRank).toBe(2)
        })

        it('userId 없으면 userBest/userRank null', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            await db.insert(users).values({
                id: 'u1',
                name: 'u1',
                email: 'u1@test.com',
                emailVerified: false
            })
            const seg = await repo.createSegment(segInput(), 'owner')
            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 100, paceSecPerKm: 200 },
                'u1'
            )

            const lb = await repo.getLeaderboard(seg.segmentId)
            expect(lb.userBest).toBeNull()
            expect(lb.userRank).toBeNull()
            expect(lb.totalEfforts).toBe(1)
        })

        it('userId 지정해도 본인 effort 가 없으면 userBest null', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            await db.insert(users).values({
                id: 'u1',
                name: 'u1',
                email: 'u1@test.com',
                emailVerified: false
            })
            await db.insert(users).values({
                id: 'u2',
                name: 'u2',
                email: 'u2@test.com',
                emailVerified: false
            })
            const seg = await repo.createSegment(segInput(), 'owner')
            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 100, paceSecPerKm: 200 },
                'u1'
            )

            const lb = await repo.getLeaderboard(seg.segmentId, 'u2')
            expect(lb.userBest).toBeNull()
            expect(lb.userRank).toBeNull()
        })
    })

    describe('listEffortsByUser', () => {
        it('user 의 effort 들을 completedAt desc 로 반환', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUserAndRoute(db, 'owner', 'r-1')
            await db.insert(users).values({
                id: 'u1',
                name: 'u1',
                email: 'u1@test.com',
                emailVerified: false
            })
            const seg = await repo.createSegment(segInput(), 'owner')

            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 100, paceSecPerKm: 200 },
                'u1'
            )
            await new Promise((r) => setTimeout(r, 10))
            await repo.createEffort(
                { segmentId: seg.segmentId, durationSec: 90, paceSecPerKm: 180 },
                'u1'
            )

            const list = await repo.listEffortsByUser('u1')
            expect(list).toHaveLength(2)
            expect(list[0]!.durationSec).toBe(90)
            expect(list[1]!.durationSec).toBe(100)
        })

        it('user 의 effort 가 없으면 빈 배열', async () => {
            const { repo } = await createFreshRepository()
            await expect(repo.listEffortsByUser('non-existent')).resolves.toEqual([])
        })
    })
})
