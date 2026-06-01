import { describe, it, expect, vi, beforeEach } from 'vitest'

import { routeService } from '../route.service'

const repo = vi.hoisted(() => ({
    getRoute: vi.fn(),
    listRoutes: vi.fn(),
    listRoutesByUser: vi.fn(),
    searchPublicRoutes: vi.fn(),
    createRoute: vi.fn(),
    createSections: vi.fn(),
    updateRoute: vi.fn(),
    deleteRoute: vi.fn(),
    deleteSectionsByRouteId: vi.fn(),
    getSectionsByRouteId: vi.fn(),
    incrementViewCount: vi.fn(),
    likeRoute: vi.fn(),
    unlikeRoute: vi.fn(),
    isLikedByUser: vi.fn(),
    hasRouteFromSource: vi.fn()
}))
const { lookupDistricts } = vi.hoisted(() => ({ lookupDistricts: vi.fn() }))
vi.mock('../../repositories', () => ({
    getRouteRepository: vi.fn(async () => repo)
}))
vi.mock('../../utils/district/district-lookup', () => ({ lookupDistricts }))

describe('routeService', () => {
    beforeEach(() => {
        Object.values(repo).forEach((fn) => fn.mockReset())
        lookupDistricts.mockReset().mockResolvedValue({ sgg: [], emd: [] })
    })

    describe('단순 위임 메서드', () => {
        it('getRouteById', async () => {
            repo.getRoute.mockResolvedValue({ routeId: 'r-1' })
            await expect(routeService.getRouteById('r-1')).resolves.toEqual({ routeId: 'r-1' })
            expect(repo.getRoute).toHaveBeenCalledWith('r-1')
        })

        it('listRoutes', async () => {
            repo.listRoutes.mockResolvedValue([])
            await routeService.listRoutes()
            expect(repo.listRoutes).toHaveBeenCalled()
        })

        it('listRoutesByUser', async () => {
            repo.listRoutesByUser.mockResolvedValue([])
            await routeService.listRoutesByUser('u-1')
            expect(repo.listRoutesByUser).toHaveBeenCalledWith('u-1')
        })

        it('searchPublicRoutes (no query)', async () => {
            repo.searchPublicRoutes.mockResolvedValue([])
            await routeService.searchPublicRoutes()
            expect(repo.searchPublicRoutes).toHaveBeenCalledWith(undefined)
        })

        it('deleteRoute', async () => {
            repo.deleteRoute.mockResolvedValue(true)
            await expect(routeService.deleteRoute('r-1')).resolves.toBe(true)
        })

        it('getSectionsByRouteId', async () => {
            repo.getSectionsByRouteId.mockResolvedValue([])
            await routeService.getSectionsByRouteId('r-1')
            expect(repo.getSectionsByRouteId).toHaveBeenCalledWith('r-1')
        })

        it('incrementViewCount', async () => {
            await routeService.incrementViewCount('r-1')
            expect(repo.incrementViewCount).toHaveBeenCalledWith('r-1')
        })

        it('isLikedByUser', async () => {
            repo.isLikedByUser.mockResolvedValue(true)
            await expect(routeService.isLikedByUser('u', 'r')).resolves.toBe(true)
        })
    })

    describe('createRouteWithSections', () => {
        it('section coords 로 lookupDistricts 호출, sgg/emd 가 enrich 됨', async () => {
            lookupDistricts.mockResolvedValue({ sgg: ['종로구'], emd: ['청운동'] })
            const created = { routeId: 'r-1' }
            const sections = [{ sectionId: 's-1' }]
            repo.createRoute.mockResolvedValue(created)
            repo.createSections.mockResolvedValue(sections)

            const input = { title: 't' }
            const sectionInputs = [
                {
                    geom: {
                        type: 'LineString' as const,
                        coordinates: [
                            [127, 37],
                            [127.01, 37.01]
                        ]
                    },
                    attrs: [],
                    pois: []
                }
            ]

            const result = await routeService.createRouteWithSections(
                input as any,
                sectionInputs as any,
                'me'
            )

            expect(lookupDistricts).toHaveBeenCalledWith([
                [127, 37],
                [127.01, 37.01]
            ])
            expect(repo.createRoute).toHaveBeenCalledWith(
                expect.objectContaining({ title: 't', sgg: ['종로구'], emd: ['청운동'] }),
                'me'
            )
            expect(repo.createSections).toHaveBeenCalledWith('r-1', sectionInputs)
            expect(result).toEqual({ route: created, sections })
        })

        it('district 검색 결과가 비어 있으면 enrich 가 undefined', async () => {
            repo.createRoute.mockResolvedValue({ routeId: 'r-1' })
            repo.createSections.mockResolvedValue([])

            await routeService.createRouteWithSections({ title: 't' } as any, [], 'me')

            const [enriched] = repo.createRoute.mock.calls[0]!
            expect(enriched.sgg).toBeUndefined()
            expect(enriched.emd).toBeUndefined()
        })
    })

    describe('updateRouteWithSections', () => {
        it('routeInput 만 있으면 sections 갱신 없이 route 업데이트', async () => {
            const updated = { routeId: 'r-1', title: 'new' }
            repo.updateRoute.mockResolvedValue(updated)
            repo.getSectionsByRouteId.mockResolvedValue([])

            const result = await routeService.updateRouteWithSections(
                'r-1',
                { title: 'new' },
                undefined
            )

            expect(repo.updateRoute).toHaveBeenCalledWith(
                'r-1',
                expect.objectContaining({ title: 'new' })
            )
            expect(repo.deleteSectionsByRouteId).not.toHaveBeenCalled()
            expect(result.route).toBe(updated)
        })

        it('sections 만 있으면 기존 sections 삭제 후 재생성, route 는 fetch', async () => {
            const fetched = { routeId: 'r-1' }
            repo.getRoute.mockResolvedValue(fetched)
            const newSections = [{ sectionId: 's-2' }]
            repo.createSections.mockResolvedValue(newSections)

            const sectionInputs = [{ geom: undefined, attrs: [], pois: [] }]
            const result = await routeService.updateRouteWithSections(
                'r-1',
                undefined,
                sectionInputs as any
            )

            expect(repo.deleteSectionsByRouteId).toHaveBeenCalledWith('r-1')
            expect(repo.createSections).toHaveBeenCalledWith('r-1', sectionInputs)
            expect(result.route).toBe(fetched)
            expect(result.sections).toBe(newSections)
        })

        it('route+section 둘 다 있으면 enrichment 적용 + sections 교체', async () => {
            lookupDistricts.mockResolvedValue({ sgg: ['강남구'], emd: [] })
            repo.updateRoute.mockResolvedValue({ routeId: 'r-1', sgg: ['강남구'] })
            repo.createSections.mockResolvedValue([])

            await routeService.updateRouteWithSections('r-1', { title: 'x' }, [
                { geom: { type: 'LineString', coordinates: [[127, 37]] }, attrs: [], pois: [] }
            ] as any)

            const [, patch] = repo.updateRoute.mock.calls[0]!
            expect(patch.sgg).toEqual(['강남구'])
            expect(patch.emd).toBeUndefined()
        })
    })

    describe('likeRoute / unlikeRoute', () => {
        it('like: 경로 없으면 404, 있으면 repo.likeRoute', async () => {
            repo.getRoute.mockResolvedValue(null)
            await expect(routeService.likeRoute('u', 'r-1')).rejects.toMatchObject({
                statusCode: 404
            })

            repo.getRoute.mockResolvedValue({ routeId: 'r-1' })
            repo.likeRoute.mockResolvedValue(true)
            await expect(routeService.likeRoute('u', 'r-1')).resolves.toBe(true)
        })

        it('unlike: 경로 없으면 404, 있으면 repo.unlikeRoute', async () => {
            repo.getRoute.mockResolvedValue(null)
            await expect(routeService.unlikeRoute('u', 'r-1')).rejects.toMatchObject({
                statusCode: 404
            })

            repo.getRoute.mockResolvedValue({ routeId: 'r-1' })
            repo.unlikeRoute.mockResolvedValue(true)
            await expect(routeService.unlikeRoute('u', 'r-1')).resolves.toBe(true)
        })
    })

    describe('forkRoute', () => {
        it('소스 경로 없으면 404', async () => {
            repo.getRoute.mockResolvedValue(null)
            await expect(routeService.forkRoute('src', 'me')).rejects.toMatchObject({
                statusCode: 404
            })
        })

        it('본인이 만든 경로 포크는 409', async () => {
            repo.getRoute.mockResolvedValue({ routeId: 'src', userId: 'me' })
            await expect(routeService.forkRoute('src', 'me')).rejects.toMatchObject({
                statusCode: 409
            })
        })

        it('이미 포크한 경로는 409', async () => {
            repo.getRoute.mockResolvedValue({ routeId: 'src', userId: 'owner' })
            repo.hasRouteFromSource.mockResolvedValue(true)
            await expect(routeService.forkRoute('src', 'me')).rejects.toMatchObject({
                statusCode: 409
            })
        })

        it('정상 fork: source title/description 복제 + sections 복제, isPublic=false', async () => {
            repo.getRoute.mockResolvedValue({
                routeId: 'src',
                userId: 'owner',
                title: 'orig',
                description: 'desc'
            })
            repo.hasRouteFromSource.mockResolvedValue(false)
            repo.createRoute.mockResolvedValue({ routeId: 'forked-1' })
            repo.getSectionsByRouteId.mockResolvedValue([
                { sectionId: 's-1', geom: 'g', attrs: 'a', pois: 'p' }
            ])
            repo.createSections.mockResolvedValue([{ sectionId: 'new-s' }])

            const result = await routeService.forkRoute('src', 'me')

            expect(repo.createRoute).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'orig',
                    description: 'desc',
                    isPublic: false,
                    sourceRouteId: 'src'
                }),
                'me'
            )
            expect(repo.createSections).toHaveBeenCalledWith('forked-1', [
                { geom: 'g', attrs: 'a', pois: 'p' }
            ])
            expect(result).toEqual({
                route: { routeId: 'forked-1' },
                sections: [{ sectionId: 'new-s' }]
            })
        })
    })
})
