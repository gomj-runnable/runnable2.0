import { z } from 'zod'
import { geoJsonLineStringSchema, sectionAttrSchema, poiSchema } from '#shared/schemas/route.schema'
import { routeService } from '../../../services/route.service'
import { requireRouteOwnership } from '../../../utils/session'
import { requireRouteIdParam } from '../../../utils/params'
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
        await requireRouteOwnership(event, routeId, routeService.getRouteById)

        const body = await readBody(event)
        const { route: routeInput, sections: sectionInputs } = updateSchema.parse(body)

        return routeService.updateRouteWithSections(routeId, routeInput, sectionInputs)
    })
)
