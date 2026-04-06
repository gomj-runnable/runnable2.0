import { routeRepository } from '../../repositories/route.repository.memory'

export default defineEventHandler(async () => {
    return routeRepository.listRoutes()
})
