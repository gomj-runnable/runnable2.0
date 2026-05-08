import { routeService } from '../../services/route.service'
import { routeDiscoverFilterSchema } from '#shared/schemas/discover.schema'
import { badRequest } from '../../utils/error'
import type { RouteDiscoverCard } from '#shared/types/discover'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const parsed = routeDiscoverFilterSchema.safeParse(query)
    if (!parsed.success) {
        throw badRequest('잘못된 요청 파라미터입니다.')
    }

    const { district, sortBy = 'recent', limit = 20 } = parsed.data

    const routes = await routeService.searchPublicRoutes()

    const filtered = district ? routes.filter((r) => r.sgg?.includes(district)) : routes

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'distance') {
            return (b.distance ?? 0) - (a.distance ?? 0)
        }
        if (sortBy === 'elevation') {
            return (b.highHeight ?? 0) - (a.highHeight ?? 0)
        }
        if (sortBy === 'popular') {
            return (b.distance ?? 0) - (a.distance ?? 0)
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
    })

    const result: RouteDiscoverCard[] = sorted.slice(0, limit).map((r) => ({
        routeId: r.routeId,
        title: r.title,
        distance: r.distance ? Number(r.distance) : undefined,
        highHeight: r.highHeight ? Number(r.highHeight) : undefined,
        lowHeight: r.lowHeight ? Number(r.lowHeight) : undefined,
        districts: r.sgg?.length ? r.sgg : undefined,
        createdAt: r.createdAt,
        authorName: r.authorName
    }))

    return result
})
