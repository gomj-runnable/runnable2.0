import { routeRepository } from '../repositories'
import { lookupDistricts } from '../utils/district-lookup'
import { conflict, notFound } from '../utils/error'
import type { RouteDraftInput } from '#shared/types/route'
import type { SavedRoute, SavedSection, CreateSectionInput } from '../repositories/route.repository'

export const routeService = {
    async getRouteById(routeId: string): Promise<SavedRoute | null> {
        return routeRepository.getRoute(routeId)
    },

    async listRoutes(): Promise<SavedRoute[]> {
        return routeRepository.listRoutes()
    },

    async listRoutesByUser(userId: string): Promise<SavedRoute[]> {
        return routeRepository.listRoutesByUser(userId)
    },

    async searchPublicRoutes(query?: string): Promise<SavedRoute[]> {
        return routeRepository.searchPublicRoutes(query)
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

        const route = await routeRepository.createRoute(enrichedRoute, userId)
        const sections = await routeRepository.createSections(route.routeId, sectionInputs)
        return { route, sections }
    },

    async updateRouteWithSections(
        routeId: string,
        routeInput: Partial<RouteDraftInput> | undefined,
        sectionInputs: CreateSectionInput[] | undefined
    ): Promise<{ route: SavedRoute | null; sections: SavedSection[] }> {
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
            updatedRoute = await routeRepository.updateRoute(routeId, {
                ...routeInput,
                ...enrichment
            })
        }

        let updatedSections: SavedSection[] | null = null
        if (sectionInputs?.length) {
            await routeRepository.deleteSectionsByRouteId(routeId)
            updatedSections = await routeRepository.createSections(routeId, sectionInputs)
        }

        return {
            route: updatedRoute ?? (await routeRepository.getRoute(routeId)),
            sections: updatedSections ?? (await routeRepository.getSectionsByRouteId(routeId))
        }
    },

    async deleteRoute(routeId: string): Promise<boolean> {
        return routeRepository.deleteRoute(routeId)
    },

    async getSectionsByRouteId(routeId: string): Promise<SavedSection[]> {
        return routeRepository.getSectionsByRouteId(routeId)
    },

    async forkRoute(
        sourceRouteId: string,
        userId: string
    ): Promise<{ route: SavedRoute; sections: SavedSection[] }> {
        const source = await routeRepository.getRoute(sourceRouteId)
        if (!source) throw notFound('경로를 찾을 수 없습니다.')

        if (source.userId === userId) throw conflict('본인이 만든 경로입니다.')

        const alreadyForked = await routeRepository.hasRouteFromSource(userId, sourceRouteId)
        if (alreadyForked) throw conflict('이미 추가된 경로입니다.')

        const forkedRoute = await routeRepository.createRoute(
            {
                title: source.title,
                description: source.description,
                isPublic: false,
                sourceRouteId: sourceRouteId
            },
            userId
        )

        const sourceSections = await routeRepository.getSectionsByRouteId(sourceRouteId)
        const forkedSections = await routeRepository.createSections(
            forkedRoute.routeId,
            sourceSections.map((s) => ({ geom: s.geom, attrs: s.attrs, pois: s.pois }))
        )

        return { route: forkedRoute, sections: forkedSections }
    }
}
