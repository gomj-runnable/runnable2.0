// PUT /api/routes/:routeId - 경로 메타데이터 및 구간 수정 (소유자 본인만 허용)
import { z } from 'zod'
import { geoJsonLineStringSchema, sectionAttrSchema, poiSchema } from '#shared/schemas/route.schema'
import { routeService } from '../../../services/route.service'
import { requireRouteOwnership } from '../../../http/session'
import { requireRouteIdParam } from '../../../http/params'
import { withExceptionHandler } from '../../../exceptions/error'

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
