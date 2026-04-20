import type { IRouteRepository } from './route.repository'
import { routeRepository as memoryRepository } from './route.repository.memory'
import { routeRepository as drizzleRepository } from './route.repository.drizzle'
import { isMemoryMode } from '../utils/config'

export const routeRepository: IRouteRepository = isMemoryMode ? memoryRepository : drizzleRepository
