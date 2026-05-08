import { z } from 'zod'
import { routeService } from '../../services/route.service'
import { badRequest } from '../../utils/error'

const searchQuerySchema = z.object({
    q: z.string().max(200).optional()
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const parsed = searchQuerySchema.safeParse(query)
    if (!parsed.success) {
        throw badRequest('잘못된 요청 파라미터입니다.')
    }

    return routeService.searchPublicRoutes(parsed.data.q)
})
