// 탐색 필터 Zod 검증 스키마
import { z } from 'zod'
import type { RouteDiscoverFilter } from '#shared/types/discover'

export const routeDiscoverFilterSchema: z.ZodType<RouteDiscoverFilter> = z.object({
    district: z.string().optional(),
    sortBy: z.enum(['distance', 'elevation', 'recent', 'popular']).optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
})
