import { describe, it, expect, beforeEach } from 'vitest'
import type { IRouteRepository } from '../route.repository'
import type { RouteDraftInput } from '#shared/types/route'

// 각 테스트마다 독립된 인스턴스를 사용하기 위해 모듈을 직접 import하지 않고
// 싱글턴 대신 클래스를 인스턴스화한다. 소스가 클래스를 export하지 않으므로
// routeRepository 싱글턴을 import해 각 테스트 전에 초기화한다.
// InMemoryRouteRepository는 private 클래스이므로 테스트는 IRouteRepository 계약만 사용한다.

// 주의: routeRepository는 모듈 싱글턴이므로 테스트 간 상태 공유를 피하기 위해
// 각 테스트에서 고유한 ID prefix를 사용하거나, 삭제로 정리한다.
// 더 깔끔하게 격리하려면 vitest의 vi.resetModules()를 사용할 수 있으나
// 현재는 각 describe block에서 생성한 경로를 직접 정리하는 방식으로 격리한다.

// routeRepository 싱글턴을 각 it에서 독립적으로 사용하기 위해
// 실제로는 매 테스트마다 새 인스턴스가 필요하다.
// vitest는 모듈 캐시를 공유하므로 vi.resetModules + dynamic import로 해결한다.

import { vi } from 'vitest'

async function createFreshRepository(): Promise<IRouteRepository> {
    vi.resetModules()
    const mod = await import('../route.repository.memory')
    return mod.routeRepository
}

const sampleInput = (overrides: Partial<RouteDraftInput> = {}): RouteDraftInput => ({
    title: '테스트 경로',
    description: '설명',
    isPublic: true,
    ...overrides,
})

describe('InMemoryRouteRepository', () => {
    describe('createRoute / getRoute', () => {
        it('경로를 생성하고 ID로 조회할 수 있다', async () => {
            const repo = await createFreshRepository()
            const created = await repo.createRoute(sampleInput(), 'user-1')

            expect(created.routeId).toBeTruthy()
            expect(created.title).toBe('테스트 경로')
            expect(created.userId).toBe('user-1')
            expect(created.createdAt).toBeTruthy()

            const found = await repo.getRoute(created.routeId)
            expect(found).not.toBeNull()
            expect(found!.routeId).toBe(created.routeId)
        })

        it('존재하지 않는 ID로 조회하면 null을 반환한다', async () => {
            const repo = await createFreshRepository()
            const result = await repo.getRoute('non-existent-id')
            expect(result).toBeNull()
        })
    })

    describe('listRoutes', () => {
        it('생성된 모든 경로를 반환한다', async () => {
            const repo = await createFreshRepository()
            await repo.createRoute(sampleInput({ title: '경로 A' }), 'user-1')
            await repo.createRoute(sampleInput({ title: '경로 B' }), 'user-2')

            const all = await repo.listRoutes()
            expect(all).toHaveLength(2)
        })

        it('경로가 없으면 빈 배열을 반환한다', async () => {
            const repo = await createFreshRepository()
            const all = await repo.listRoutes()
            expect(all).toHaveLength(0)
        })
    })

    describe('listRoutesByUser', () => {
        it('특정 userId의 경로만 반환한다', async () => {
            const repo = await createFreshRepository()
            await repo.createRoute(sampleInput({ title: '유저1 경로' }), 'user-1')
            await repo.createRoute(sampleInput({ title: '유저2 경로' }), 'user-2')

            const user1Routes = await repo.listRoutesByUser('user-1')
            expect(user1Routes).toHaveLength(1)
            expect(user1Routes[0]!.userId).toBe('user-1')
        })

        it('해당 userId 경로가 없으면 빈 배열을 반환한다', async () => {
            const repo = await createFreshRepository()
            const result = await repo.listRoutesByUser('no-such-user')
            expect(result).toHaveLength(0)
        })
    })

    describe('updateRoute', () => {
        it('기존 경로를 업데이트하고 반환한다', async () => {
            const repo = await createFreshRepository()
            const created = await repo.createRoute(sampleInput(), 'user-1')

            const updated = await repo.updateRoute(created.routeId, { title: '수정된 경로' })
            expect(updated).not.toBeNull()
            expect(updated!.title).toBe('수정된 경로')
            expect(updated!.routeId).toBe(created.routeId)

            // getRoute로 재조회해도 업데이트가 반영돼 있어야 한다
            const refetched = await repo.getRoute(created.routeId)
            expect(refetched!.title).toBe('수정된 경로')
        })

        it('존재하지 않는 ID 업데이트는 null을 반환한다', async () => {
            const repo = await createFreshRepository()
            const result = await repo.updateRoute('non-existent-id', { title: '없음' })
            expect(result).toBeNull()
        })

        it('일부 필드만 업데이트해도 나머지 필드는 유지된다', async () => {
            const repo = await createFreshRepository()
            const created = await repo.createRoute(
                sampleInput({ title: '원본', description: '설명 유지' }),
                'user-1'
            )
            const updated = await repo.updateRoute(created.routeId, { title: '변경됨' })
            expect(updated!.description).toBe('설명 유지')
        })
    })

    describe('deleteRoute', () => {
        it('경로를 삭제하면 true를 반환하고 이후 조회 시 null이다', async () => {
            const repo = await createFreshRepository()
            const created = await repo.createRoute(sampleInput(), 'user-1')

            const deleted = await repo.deleteRoute(created.routeId)
            expect(deleted).toBe(true)

            const found = await repo.getRoute(created.routeId)
            expect(found).toBeNull()
        })

        it('존재하지 않는 ID 삭제는 false를 반환한다', async () => {
            const repo = await createFreshRepository()
            const result = await repo.deleteRoute('non-existent-id')
            expect(result).toBe(false)
        })
    })

    describe('searchPublicRoutes', () => {
        it('isPublic=true 경로만 반환한다', async () => {
            const repo = await createFreshRepository()
            await repo.createRoute(sampleInput({ title: '공개', isPublic: true }), 'user-1')
            await repo.createRoute(sampleInput({ title: '비공개', isPublic: false }), 'user-2')

            const results = await repo.searchPublicRoutes()
            expect(results).toHaveLength(1)
            expect(results[0]!.title).toBe('공개')
        })

        it('query가 있으면 title 또는 description에서 검색한다', async () => {
            const repo = await createFreshRepository()
            await repo.createRoute(sampleInput({ title: '한강 달리기', isPublic: true }), 'user-1')
            await repo.createRoute(sampleInput({ title: '남산 코스', isPublic: true }), 'user-2')

            const results = await repo.searchPublicRoutes('한강')
            expect(results).toHaveLength(1)
            expect(results[0]!.title).toBe('한강 달리기')
        })

        it('query가 없으면 모든 공개 경로를 반환한다', async () => {
            const repo = await createFreshRepository()
            await repo.createRoute(sampleInput({ title: 'A', isPublic: true }), 'user-1')
            await repo.createRoute(sampleInput({ title: 'B', isPublic: true }), 'user-2')

            const results = await repo.searchPublicRoutes()
            expect(results).toHaveLength(2)
        })
    })

    describe('createSection / getSectionsByRouteId', () => {
        it('구간을 생성하고 routeId로 조회할 수 있다', async () => {
            const repo = await createFreshRepository()
            const route = await repo.createRoute(sampleInput(), 'user-1')

            const section = await repo.createSection(route.routeId, {})
            expect(section.sectionId).toBeTruthy()
            expect(section.routeId).toBe(route.routeId)

            const sections = await repo.getSectionsByRouteId(route.routeId)
            expect(sections).toHaveLength(1)
            expect(sections[0]!.sectionId).toBe(section.sectionId)
        })

        it('다른 routeId의 구간은 조회되지 않는다', async () => {
            const repo = await createFreshRepository()
            const route1 = await repo.createRoute(sampleInput(), 'user-1')
            const route2 = await repo.createRoute(sampleInput(), 'user-2')

            await repo.createSection(route1.routeId, {})
            const sections = await repo.getSectionsByRouteId(route2.routeId)
            expect(sections).toHaveLength(0)
        })
    })

    describe('createSections', () => {
        it('여러 구간을 한번에 생성한다', async () => {
            const repo = await createFreshRepository()
            const route = await repo.createRoute(sampleInput(), 'user-1')

            const sections = await repo.createSections(route.routeId, [{}, {}, {}])
            expect(sections).toHaveLength(3)
            expect(sections.every((s) => s.routeId === route.routeId)).toBe(true)
            // 각 sectionId가 고유해야 한다
            const ids = sections.map((s) => s.sectionId)
            expect(new Set(ids).size).toBe(3)
        })
    })

    describe('전체 CRUD 사이클', () => {
        it('생성 → 조회 → 업데이트 → 삭제 흐름이 정상 동작한다', async () => {
            const repo = await createFreshRepository()

            // 생성
            const created = await repo.createRoute(sampleInput({ title: '원본 제목' }), 'user-A')
            expect(created.routeId).toBeTruthy()

            // 조회
            const found = await repo.getRoute(created.routeId)
            expect(found!.title).toBe('원본 제목')

            // 목록
            const all = await repo.listRoutes()
            expect(all.some((r) => r.routeId === created.routeId)).toBe(true)

            // 업데이트
            const updated = await repo.updateRoute(created.routeId, { title: '수정된 제목' })
            expect(updated!.title).toBe('수정된 제목')

            // 삭제
            const deleted = await repo.deleteRoute(created.routeId)
            expect(deleted).toBe(true)

            // 삭제 후 조회
            const afterDelete = await repo.getRoute(created.routeId)
            expect(afterDelete).toBeNull()
        })
    })
})
