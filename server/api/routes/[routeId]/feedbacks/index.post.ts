import { nanoid } from 'nanoid'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'
import { getRouteInfoRepository } from '../../../../repositories'
import { withAuth } from '../../../../utils/withAuth'
import { badRequest, withExceptionHandler } from '../../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const routeId = getRouterParam(event, 'routeId')
            if (!routeId) {
                throw badRequest('경로 ID가 필요합니다.')
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
)
