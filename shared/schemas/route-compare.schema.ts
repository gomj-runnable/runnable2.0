import { z } from 'zod'

/**
 * `/api/routes/compare` 쿼리 파라미터 검증 스키마 (#188).
 */
export const routeCompareQuerySchema = z.object({
    routeA: z.string().min(1),
    routeB: z.string().min(1)
})

export type RouteCompareQuery = z.infer<typeof routeCompareQuerySchema>
