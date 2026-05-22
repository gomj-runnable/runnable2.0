import { describe, it, expect, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import type { drizzle } from 'drizzle-orm/pglite'
import { initPgliteDb, resetDb } from '../../database/client'
import { DrizzleRunRecordRepository } from '../run-record.repository.drizzle'
import { users } from '../../database/schema'
import type * as schema from '../../database/schema'

type PgliteDb = ReturnType<typeof drizzle<typeof schema>>

async function createFreshRepository(): Promise<{
    repo: DrizzleRunRecordRepository
    db: PgliteDb
}> {
    resetDb()
    const pglite = new PGlite()
    const db = (await initPgliteDb(pglite)) as PgliteDb
    return { repo: new DrizzleRunRecordRepository(db), db }
}

async function seedUser(db: PgliteDb, userId: string): Promise<void> {
    await db.insert(users).values({
        id: userId,
        name: userId,
        email: `${userId}@test.com`,
        emailVerified: false
    })
}

const baseInput = (overrides: Record<string, unknown> = {}) => ({
    runDate: '2026-05-15',
    distanceKm: 5.2,
    durationSec: 1800,
    avgPaceSecPerKm: 346,
    rpe: 6,
    condition: 'normal' as const,
    ...overrides
})

describe('DrizzleRunRecordRepository (PGlite in-memory)', () => {
    beforeEach(() => {
        resetDb()
    })

    describe('create + getById', () => {
        it('필수 필드만으로 생성하고 ID 로 조회', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            const created = await repo.create(baseInput(), 'u1')
            expect(created.recordId).toBeTruthy()
            expect(created.userId).toBe('u1')
            expect(created.distanceKm).toBeCloseTo(5.2, 3)
            expect(created.routeId).toBeUndefined()
            expect(created.sleepHours).toBeUndefined()
            expect(created.painAreas).toBeUndefined()

            const fetched = await repo.getById(created.recordId)
            expect(fetched).not.toBeNull()
            expect(fetched!.recordId).toBe(created.recordId)
        })

        it('optional 필드 모두 채워서 생성', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            const created = await repo.create(
                baseInput({
                    sleepHours: 7.5,
                    stressLevel: 3,
                    painAreas: ['knee', 'ankle'],
                    weatherSnapshot: { tempC: 18, humidity: 60 },
                    notes: '컨디션 좋음'
                }),
                'u1'
            )

            expect(created.sleepHours).toBeCloseTo(7.5, 1)
            expect(created.stressLevel).toBe(3)
            expect(created.painAreas).toEqual(['knee', 'ankle'])
            expect(created.weatherSnapshot).toEqual({ tempC: 18, humidity: 60 })
            expect(created.notes).toBe('컨디션 좋음')
        })

        it('존재하지 않는 recordId 는 null', async () => {
            const { repo } = await createFreshRepository()
            const result = await repo.getById('non-existent')
            expect(result).toBeNull()
        })
    })

    describe('listByUser', () => {
        it('runDate desc 순으로 반환하고 다른 user 는 제외', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')
            await seedUser(db, 'u2')

            await repo.create(baseInput({ runDate: '2026-05-10' }), 'u1')
            await repo.create(baseInput({ runDate: '2026-05-12' }), 'u1')
            await repo.create(baseInput({ runDate: '2026-05-15' }), 'u2')

            const list = await repo.listByUser('u1')
            expect(list).toHaveLength(2)
            expect(list[0]!.runDate).toBe('2026-05-12')
            expect(list[1]!.runDate).toBe('2026-05-10')
        })

        it('limit + offset 으로 페이징', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            for (let i = 1; i <= 5; i++) {
                await repo.create(baseInput({ runDate: `2026-05-0${i}` }), 'u1')
            }

            const page1 = await repo.listByUser('u1', 2, 0)
            const page2 = await repo.listByUser('u1', 2, 2)
            expect(page1).toHaveLength(2)
            expect(page2).toHaveLength(2)
            expect(page1[0]!.runDate).toBe('2026-05-05')
            expect(page2[0]!.runDate).toBe('2026-05-03')
        })
    })

    describe('update', () => {
        it('부분 patch — rpe/notes 만 갱신', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')
            const created = await repo.create(baseInput({ rpe: 5 }), 'u1')

            const updated = await repo.update(created.recordId, { rpe: 8, notes: '힘들었음' })
            expect(updated).not.toBeNull()
            expect(updated!.rpe).toBe(8)
            expect(updated!.notes).toBe('힘들었음')
        })

        it('빈 patch 는 getById 결과 그대로 반환', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')
            const created = await repo.create(baseInput(), 'u1')

            const result = await repo.update(created.recordId, {})
            expect(result).not.toBeNull()
            expect(result!.recordId).toBe(created.recordId)
        })

        it('painAreas null 명시는 painAreas 를 빈/없는 상태로 갱신', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')
            const created = await repo.create(baseInput({ painAreas: ['knee'] }), 'u1')

            const updated = await repo.update(created.recordId, {
                painAreas: null as unknown as string[]
            })
            expect(updated).not.toBeNull()
            expect(updated!.painAreas).toBeUndefined()
        })

        it('존재하지 않는 recordId 는 null', async () => {
            const { repo } = await createFreshRepository()
            const result = await repo.update('non-existent', { rpe: 5 })
            expect(result).toBeNull()
        })
    })

    describe('delete', () => {
        it('존재 → true, 미존재 → false', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')
            const created = await repo.create(baseInput(), 'u1')

            await expect(repo.delete(created.recordId)).resolves.toBe(true)
            await expect(repo.delete('non-existent')).resolves.toBe(false)
        })
    })

    describe('getWeeklyInsight', () => {
        it('주간 합산: 거리/페이스/RPE/condition 분포/통증부위 집계', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            // 이번 주 (2026-05-11 월 ~ 5/17 일)
            await repo.create(
                baseInput({
                    runDate: '2026-05-11',
                    distanceKm: 4,
                    rpe: 5,
                    condition: 'good',
                    painAreas: ['knee']
                }),
                'u1'
            )
            await repo.create(
                baseInput({
                    runDate: '2026-05-13',
                    distanceKm: 6,
                    rpe: 7,
                    condition: 'normal',
                    painAreas: ['knee', 'ankle']
                }),
                'u1'
            )
            // 다른 주
            await repo.create(
                baseInput({
                    runDate: '2026-05-20',
                    distanceKm: 100,
                    rpe: 1,
                    condition: 'bad'
                }),
                'u1'
            )

            const insight = await repo.getWeeklyInsight('u1', '2026-05-11')
            expect(insight.weekStart).toBe('2026-05-11')
            expect(insight.recordCount).toBe(2)
            expect(insight.avgRpe).toBeCloseTo(6, 1)
            expect(insight.totalDistanceKm).toBeCloseTo(10, 2)
            expect(insight.conditionDistribution.good).toBe(1)
            expect(insight.conditionDistribution.normal).toBe(1)
            expect(insight.conditionDistribution.bad).toBe(0)
            expect(insight.painFrequency.knee).toBe(2)
            expect(insight.painFrequency.ankle).toBe(1)
            // 이전 주 데이터 없음 → deltaRpeVsLastWeek = null
            expect(insight.deltaRpeVsLastWeek).toBeNull()
        })

        it('이전 주 RPE 와 비교한 delta 계산', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            // 이전 주 (2026-05-04 ~ 5/10)
            await repo.create(
                baseInput({ runDate: '2026-05-05', rpe: 5, condition: 'normal' }),
                'u1'
            )
            // 이번 주
            await repo.create(
                baseInput({ runDate: '2026-05-12', rpe: 8, condition: 'normal' }),
                'u1'
            )

            const insight = await repo.getWeeklyInsight('u1', '2026-05-11')
            expect(insight.deltaRpeVsLastWeek).toBeCloseTo(3, 1)
        })

        it('이번 주 데이터 0 건이면 모든 합산이 0', async () => {
            const { repo, db } = await createFreshRepository()
            await seedUser(db, 'u1')

            const insight = await repo.getWeeklyInsight('u1', '2026-05-11')
            expect(insight.recordCount).toBe(0)
            expect(insight.avgRpe).toBe(0)
            expect(insight.totalDistanceKm).toBe(0)
            expect(insight.avgPaceSecPerKm).toBe(0)
        })
    })
})
