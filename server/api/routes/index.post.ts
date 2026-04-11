import { z } from 'zod'
import {
    createRouteSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema
} from '#shared/schemas/route.schema'
import { routeRepository } from '../../repositories'
import { requireSession } from '../../utils/session'

const requestSchema = z.object({
    route: createRouteSchema.extend({ isPublic: z.boolean().optional().default(true) }),
    sections: z.array(
        z.object({
            geom: geoJsonLineStringSchema.optional(),
            attrs: z.array(sectionAttrSchema).optional()
        })
    )
})

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const body = await readBody(event)
    const { route: routeInput, sections: sectionInputs } = requestSchema.parse(body)

    const storedRoute = await routeRepository.createRoute(routeInput, user.userId)
    const storedSections = await routeRepository.createSections(storedRoute.routeId, sectionInputs)

    return { route: storedRoute, sections: storedSections }
})
