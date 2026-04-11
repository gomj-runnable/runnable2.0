import { routeRepository } from '../../repositories'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const q = typeof query.q === 'string' ? query.q : undefined

    return routeRepository.searchPublicRoutes(q)
})
