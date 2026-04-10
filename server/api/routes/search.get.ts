import { routeRepository } from '../../repositories/route.repository.drizzle'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const q = typeof query.q === 'string' ? query.q : undefined

    return routeRepository.searchPublicRoutes(q)
})
