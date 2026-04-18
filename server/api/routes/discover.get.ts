import { routeRepository } from '../../repositories'
import { routeDiscoverFilterSchema } from '#shared/schemas/discover.schema'
import type { RouteDiscoverCard } from '#shared/types/discover'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    // 쿼리 파라미터 검증
    const parsed = routeDiscoverFilterSchema.safeParse(query)
    if (!parsed.success) {
        throw createError({ statusCode: 400, message: '잘못된 요청 파라미터입니다.' })
    }

    const { district, sortBy = 'recent', limit = 20 } = parsed.data

    // 공개 경로 전체 조회
    const routes = await routeRepository.searchPublicRoutes()

    // district 필터 적용 (sgg 배열에 해당 구가 포함된 경로만 반환)
    const filtered = district
        ? routes.filter((r) => r.sgg?.includes(district))
        : routes

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'distance') {
            return (b.distance ?? 0) - (a.distance ?? 0)
        }
        if (sortBy === 'elevation') {
            return (b.highHeight ?? 0) - (a.highHeight ?? 0)
        }
        if (sortBy === 'popular') {
            // 현재 인기순 기준 없음 → 거리 기준으로 대체
            return (b.distance ?? 0) - (a.distance ?? 0)
        }
        // recent (기본값): 최신순
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
    })

    // limit 적용 후 RouteDiscoverCard 형태로 반환
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
