// POST /api/routes - 새 경로 및 구간 생성 (로그인 필수)
import { z } from 'zod'
import {
    createRouteSchema,
    geoJsonLineStringSchema,
    sectionAttrSchema,
    poiSchema
} from '#shared/schemas/route.schema'
import { routeService } from '../../services/route.service'
import { withAuth } from '../../http/withAuth'
import { withExceptionHandler } from '../../exceptions/error'

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
    withExceptionHandler(
        withAuth(async (event, user) => {
            const body = await readBody(event)
            const { route: routeInput, sections: sectionInputs } = requestSchema.parse(body)

            return routeService.createRouteWithSections(routeInput, sectionInputs, user.userId)
        })
    )
)
