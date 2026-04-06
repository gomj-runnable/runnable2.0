import { z } from 'zod'
import { createRouteSchema, sectionAttrSchema } from '#shared/schemas/route.schema'
import { routeRepository } from '../../repositories/route.repository.memory'

const requestSchema = z.object({
    route: createRouteSchema,
    section: z.object({
        geom: z.string().optional(),
        attrs: z.array(sectionAttrSchema).optional()
    })
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { route: routeInput, section: sectionInput } = requestSchema.parse(body)

    const storedRoute = await routeRepository.createRoute(routeInput)
    const storedSection = await routeRepository.createSection(storedRoute.routeId, sectionInput)

    return { route: storedRoute, section: storedSection }
})
