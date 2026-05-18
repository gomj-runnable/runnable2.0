import { nanoid } from 'nanoid'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'
import { getRouteInfoRepository } from '../../../../repositories'
import { routeService } from '../../../../services/route.service'
import { requireRouteIdParam } from '../../../../utils/params'
import { requireSession } from '../../../../utils/session'
import { withExceptionHandler } from '../../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const routeId = requireRouteIdParam(event)
        const user = await requireSession(event)

        const route = await routeService.getRouteById(routeId)
        if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
        if (!route.isPublic && route.userId !== user.userId) {
            throw createError({ statusCode: 403, message: '비공개 경로입니다.' })
        }

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
