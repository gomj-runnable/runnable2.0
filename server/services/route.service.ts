import { getRouteRepository } from '../repositories'
import { lookupDistricts } from '../utils/district-lookup'
import { conflict, notFound } from '../utils/error'
import type { RouteDraftInput } from '#shared/types/route'
import type { SavedRoute, SavedSection, CreateSectionInput } from '../repositories/route.repository'

export const routeService = {
    async getRouteById(routeId: string): Promise<SavedRoute | null> {
        return (await getRouteRepository()).getRoute(routeId)
    },

    async listRoutes(): Promise<SavedRoute[]> {
        return (await getRouteRepository()).listRoutes()
    },

    async listRoutesByUser(userId: string): Promise<SavedRoute[]> {
        return (await getRouteRepository()).listRoutesByUser(userId)
    },

    async searchPublicRoutes(query?: string): Promise<SavedRoute[]> {
        return (await getRouteRepository()).searchPublicRoutes(query)
    },

    async createRouteWithSections(
        routeInput: RouteDraftInput,
        sectionInputs: CreateSectionInput[],
        userId: string
    ): Promise<{ route: SavedRoute; sections: SavedSection[] }> {
        const allCoords: [number, number][] = sectionInputs
            .flatMap((s) => s.geom?.coordinates ?? [])
            .map(([lng, lat]) => [lng, lat] as [number, number])

        const { sgg, emd } = await lookupDistricts(allCoords)
        const enrichedRoute = {
            ...routeInput,
            sgg: sgg.length > 0 ? sgg : undefined,
            emd: emd.length > 0 ? emd : undefined
        }

        const repo = await getRouteRepository()
        const route = await repo.createRoute(enrichedRoute, userId)
        const sections = await repo.createSections(route.routeId, sectionInputs)
        return { route, sections }
    },

    async updateRouteWithSections(
        routeId: string,
        routeInput: Partial<RouteDraftInput> | undefined,
        sectionInputs: CreateSectionInput[] | undefined
    ): Promise<{ route: SavedRoute | null; sections: SavedSection[] }> {
        const repo = await getRouteRepository()
        let updatedRoute: SavedRoute | null = null
        if (routeInput) {
            const enrichment: Record<string, string[] | undefined> = {}
            if (sectionInputs?.length) {
                const allCoords: [number, number][] = sectionInputs
                    .flatMap((s) => s.geom?.coordinates ?? [])
                    .map(([lng, lat]) => [lng, lat] as [number, number])
                const { sgg, emd } = await lookupDistricts(allCoords)
                enrichment.sgg = sgg.length > 0 ? sgg : undefined
                enrichment.emd = emd.length > 0 ? emd : undefined
            }
            updatedRoute = await repo.updateRoute(routeId, {
                ...routeInput,
                ...enrichment
            })
        }

        let updatedSections: SavedSection[] | null = null
        if (sectionInputs?.length) {
            await repo.deleteSectionsByRouteId(routeId)
            updatedSections = await repo.createSections(routeId, sectionInputs)
        }

        return {
            route: updatedRoute ?? (await repo.getRoute(routeId)),
            sections: updatedSections ?? (await repo.getSectionsByRouteId(routeId))
        }
    },

    async deleteRoute(routeId: string): Promise<boolean> {
        return (await getRouteRepository()).deleteRoute(routeId)
    },

    async getSectionsByRouteId(routeId: string): Promise<SavedSection[]> {
        return (await getRouteRepository()).getSectionsByRouteId(routeId)
    },

    async forkRoute(
        sourceRouteId: string,
        userId: string
    ): Promise<{ route: SavedRoute; sections: SavedSection[] }> {
        const repo = await getRouteRepository()
        const source = await repo.getRoute(sourceRouteId)
        if (!source) throw notFound('경로를 찾을 수 없습니다.')

        if (source.userId === userId) throw conflict('본인이 만든 경로입니다.')

        const alreadyForked = await repo.hasRouteFromSource(userId, sourceRouteId)
        if (alreadyForked) throw conflict('이미 추가된 경로입니다.')

        const forkedRoute = await repo.createRoute(
            {
                title: source.title,
                description: source.description,
                isPublic: false,
                sourceRouteId: sourceRouteId
            },
            userId
        )

        const sourceSections = await repo.getSectionsByRouteId(sourceRouteId)
        const forkedSections = await repo.createSections(
            forkedRoute.routeId,
            sourceSections.map((s) => ({ geom: s.geom, attrs: s.attrs, pois: s.pois }))
        )

        return { route: forkedRoute, sections: forkedSections }
    }
}
