import type { IRouteRepository } from './route.repository'
import { routeRepository as memoryRepository } from './route.repository.memory'
import { routeRepository as drizzleRepository } from './route.repository.drizzle'

export const routeRepository: IRouteRepository =
    process.env.USE_DATABASE_MODE === 'MEMORY' ? memoryRepository : drizzleRepository
