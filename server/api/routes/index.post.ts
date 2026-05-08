import { z } from 'zod'
import {
    createRouteSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema,
    poiSchema
} from '#shared/schemas/route.schema'
import { routeService } from '../../services/route.service'
import { requireSession } from '../../utils/session'
import { withExceptionHandler } from '../../utils/error'

const requestSchema = z.object({
    route: createRouteSchema,
    sections: z.array(
        z.object({
            geom: geoJsonLineStringSchema.optional(),
            attrs: z.array(sectionAttrSchema).optional(),
            pois: z.array(poiSchema).optional()
        })
    )
})

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const user = await requireSession(event)
        const body = await readBody(event)
        const { route: routeInput, sections: sectionInputs } = requestSchema.parse(body)

        return routeService.createRouteWithSections(routeInput, sectionInputs, user.userId)
    })
)
