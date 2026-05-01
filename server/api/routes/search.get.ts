import { z } from 'zod'
import { routeRepository } from '../../repositories'

const searchQuerySchema = z.object({
    q: z.string().max(200).optional()
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const parsed = searchQuerySchema.safeParse(query)
    if (!parsed.success) {
        throw createError({ statusCode: 400, message: '잘못된 요청 파라미터입니다.' })
    }

    return routeRepository.searchPublicRoutes(parsed.data.q)
})
