import { z } from 'zod'
import { geoJsonLineStringSchema, sectionAttrSchema, poiSchema } from '#shared/schemas/route.schema'
import { routeRepository } from '../../../repositories'
import { requireRouteOwnership } from '../../../utils/session'
import { requireRouteIdParam } from '../../../utils/params'
import { lookupDistricts } from '../../../utils/district-lookup'
import { withExceptionHandler } from '../../../utils/error'

const updateSchema = z.object({
    route: z
        .object({
            title: z.string().min(1).max(255).optional(),
            description: z.string().optional(),
            isPublic: z.boolean().optional()
        })
        .optional(),
    sections: z
        .array(
            z.object({
                geom: geoJsonLineStringSchema.optional(),
                attrs: z.array(sectionAttrSchema).optional(),
                pois: z.array(poiSchema).optional()
            })
        )
        .optional()
})

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const routeId = requireRouteIdParam(event)
        await requireRouteOwnership(event, routeId, routeRepository)

        const body = await readBody(event)
        const { route: routeInput, sections: sectionInputs } = updateSchema.parse(body)

        // 경로 메타데이터 업데이트
        let updatedRoute = null
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

        // 구간 교체 (기존 삭제 → 새로 생성)
        let updatedSections = null
        if (sectionInputs?.length) {
            await routeRepository.deleteSectionsByRouteId(routeId)
            updatedSections = await routeRepository.createSections(routeId, sectionInputs)
        }

        return {
            route: updatedRoute ?? (await routeRepository.getRoute(routeId)),
            sections: updatedSections ?? (await routeRepository.getSectionsByRouteId(routeId))
        }
    })
)
