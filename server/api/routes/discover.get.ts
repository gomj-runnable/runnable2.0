// GET /api/routes/discover - 공개 경로 탐색 (구/동 필터, 정렬, 좋아요 여부 포함)
import { routeService } from '../../services/route.service'
import { routeDiscoverFilterSchema } from '#shared/schemas/discover.schema'
import { badRequest } from '../../utils/error'
import { getSessionUser } from '../../utils/session'
import type { RouteDiscoverCard } from '#shared/types/discover'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const parsed = routeDiscoverFilterSchema.safeParse(query)
    if (!parsed.success) {
        throw badRequest('잘못된 요청 파라미터입니다.')
    }

    const { district, sortBy = 'recent', limit = 20 } = parsed.data

    const [routes, user] = await Promise.all([
        routeService.searchPublicRoutes(),
        getSessionUser(event)
    ])

    const filtered = district ? routes.filter((r) => r.sgg?.includes(district)) : routes

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'distance') {
            return (b.distance ?? 0) - (a.distance ?? 0)
        }
        if (sortBy === 'elevation') {
            return (b.highHeight ?? 0) - (a.highHeight ?? 0)
        }
        if (sortBy === 'popular') {
            return (b.likeCount ?? 0) - (a.likeCount ?? 0)
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
    })

    const sliced = sorted.slice(0, limit)

    const likedSet = new Set<string>()
    if (user) {
        await Promise.all(
            sliced.map(async (r) => {
                const liked = await routeService.isLikedByUser(user.userId, r.routeId)
                if (liked) likedSet.add(r.routeId)
            })
        )
    }

    const result: RouteDiscoverCard[] = sliced.map((r) => ({
        routeId: r.routeId,
        title: r.title,
        distance: r.distance ? Number(r.distance) : undefined,
        highHeight: r.highHeight ? Number(r.highHeight) : undefined,
        lowHeight: r.lowHeight ? Number(r.lowHeight) : undefined,
        districts: r.sgg?.length ? r.sgg : undefined,
        createdAt: r.createdAt,
        authorName: r.authorName,
        viewCount: r.viewCount ?? 0,
        likeCount: r.likeCount ?? 0,
        likedByMe: likedSet.has(r.routeId)
    }))

    return result
})
