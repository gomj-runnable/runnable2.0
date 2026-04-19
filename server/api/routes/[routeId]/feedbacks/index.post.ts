import { nanoid } from 'nanoid'
import { createRouteInfoSchema } from '#shared/schemas/routeInfo.schema'
import { routeInfos } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { memoryRouteInfos } from '../../../../utils/memoryStore'

/** POST /api/routes/:routeId/feedbacks — 경로정보 추가 (로그인 필수) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw createError({ statusCode: 400, message: '경로 ID가 필요합니다.' })
    }

    const user = await requireSession(event)

    const body = await readBody(event)
    const input = createRouteInfoSchema.parse(body)

    const routeInfoId = nanoid()
    const authorName = user.name ?? '익명'

    if (!db) {
        const memoryRouteInfo = {
            routeInfoId,
            routeId,
            userId: user.userId,
            name: input.name,
            description: input.description,
            lng: String(input.lng),
            lat: String(input.lat),
            elevation: input.elevation != null ? String(input.elevation) : null,
            authorName,
            createdAt: new Date().toISOString()
        }
        memoryRouteInfos.push(memoryRouteInfo)
        return memoryRouteInfo
    }

    const [routeInfo] = await db
        .insert(routeInfos)
        .values({
            routeInfoId,
            routeId,
            userId: user.userId,
            name: input.name,
            description: input.description,
            lng: String(input.lng),
            lat: String(input.lat),
            elevation: input.elevation != null ? String(input.elevation) : null,
            authorName
        })
        .returning()

    return routeInfo
})
