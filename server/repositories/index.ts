import type { IRouteRepository } from './route.repository'
import { routeRepository as memoryRepository } from './route.repository.memory'
import { routeRepository as drizzleRepository } from './route.repository.drizzle'
import { createRepository } from './factory'

export const routeRepository: IRouteRepository = createRepository(
    memoryRepository,
    drizzleRepository
)
