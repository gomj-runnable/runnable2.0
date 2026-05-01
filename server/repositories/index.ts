import type { IRouteRepository } from './route.repository'
import { routeRepository as memoryRepository } from './route.repository.memory'
import { routeRepository as drizzleRepository } from './route.repository.drizzle'
import type { IRouteInfoRepository } from './routeInfo.repository'
import { routeInfoRepository as memoryRouteInfoRepository } from './routeInfo.repository.memory'
import { routeInfoRepository as drizzleRouteInfoRepository } from './routeInfo.repository.drizzle'
import { createRepository } from './factory'

export const routeRepository: IRouteRepository = createRepository(
    memoryRepository,
    drizzleRepository
)

export const routeInfoRepository: IRouteInfoRepository = createRepository(
    memoryRouteInfoRepository,
    drizzleRouteInfoRepository
)
