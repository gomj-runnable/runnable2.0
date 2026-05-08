import { routeInfoRepository } from '../repositories'
import type { NewRouteInfo, SavedRouteInfo } from '../repositories/routeInfo.repository'

export const routeInfoService = {
    async findByRouteId(routeId: string): Promise<SavedRouteInfo[]> {
        return routeInfoRepository.findByRouteId(routeId)
    },

    async create(input: NewRouteInfo): Promise<SavedRouteInfo> {
        return routeInfoRepository.create(input)
    }
}
