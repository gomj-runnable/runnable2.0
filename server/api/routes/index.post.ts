import { z } from 'zod'
import {
    createRouteSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema,
    poiSchema
} from '#shared/schemas/route.schema'
import { routeRepository } from '../../repositories'
import { requireSession } from '../../utils/session'
import { lookupDistricts } from '../../utils/district-lookup'

const requestSchema = z.object({
    route: createRouteSchema.extend({ isPublic: z.boolean().optional().default(true) }),
    sections: z.array(
        z.object({
            geom: geoJsonLineStringSchema.optional(),
            attrs: z.array(sectionAttrSchema).optional(),
            pois: z.array(poiSchema).optional()
        })
    )
})

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const body = await readBody(event)
    const { route: routeInput, sections: sectionInputs } = requestSchema.parse(body)

    // 전체 구간 좌표에서 시군구/읍면동을 역산한다
    const allCoords: [number, number][] = sectionInputs
        .flatMap((s) => s.geom?.coordinates ?? [])
        .map(([lng, lat]) => [lng, lat] as [number, number])

    const { sgg, emd } = await lookupDistricts(allCoords)
    const enrichedRoute = {
        ...routeInput,
        sgg: sgg.length > 0 ? sgg : undefined,
        emd: emd.length > 0 ? emd : undefined
    }

    const storedRoute = await routeRepository.createRoute(enrichedRoute, user.userId)
    const storedSections = await routeRepository.createSections(storedRoute.routeId, sectionInputs)

    return { route: storedRoute, sections: storedSections }
})
