import { nanoid } from 'nanoid'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'
import { routeInfoService } from '../../../../services/routeInfo.service'
import { requireSession } from '../../../../utils/session'
import { badRequest, withExceptionHandler } from '../../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const routeId = getRouterParam(event, 'routeId')
        if (!routeId) {
            throw badRequest('경로 ID가 필요합니다.')
        }

        const user = await requireSession(event)

        const body = await readBody(event)
        const input = createRouteInfoSchema.parse(body)

        return routeInfoService.create({
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
