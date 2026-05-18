import { nanoid } from 'nanoid'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'
import { getRouteInfoRepository } from '../../../../repositories'
import { routeService } from '../../../../services/route.service'
import { requireRouteIdParam } from '../../../../utils/params'
import { requireRouteOwnership, requireSession } from '../../../../utils/session'
import { withExceptionHandler } from '../../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const routeId = requireRouteIdParam(event)
        await requireRouteOwnership(event, routeId, routeService.getRouteById)
        const user = await requireSession(event)

        const body = await readBody(event)
        const input = createRouteInfoSchema.parse(body)

        return (await getRouteInfoRepository()).create({
            routeInfoId: nanoid(),
            routeId,
            userId: user.userId,
            name: input.name,
            description: input.description,
            lng: String(input.lng),
            lat: String(input.lat),
            elevation: input.elevation != null ? String(input.elevation) : null,
            authorName: user.name ?? '익명'
        })
    })
)
