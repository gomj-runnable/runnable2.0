import { z } from 'zod'
import {
    createRouteSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema
} from '#shared/schemas/route.schema'
import { routeRepository } from '../../repositories/route.repository.memory'

const requestSchema = z.object({
    route: createRouteSchema,
    sections: z.array(
        z.object({
            geom: geoJsonLineStringSchema.optional(),
            attrs: z.array(sectionAttrSchema).optional()
        })
    )
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { route: routeInput, sections: sectionInputs } = requestSchema.parse(body)

    const storedRoute = await routeRepository.createRoute(routeInput)
    const storedSections = await Promise.all(
        sectionInputs.map((sectionInput) =>
            routeRepository.createSection(storedRoute.routeId, sectionInput)
        )
    )

    return { route: storedRoute, sections: storedSections }
})
