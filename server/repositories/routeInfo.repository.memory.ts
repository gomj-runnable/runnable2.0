import { memoryRouteInfos } from '../utils/memoryStore'
import type { IRouteInfoRepository, NewRouteInfo, SavedRouteInfo } from './routeInfo.repository'

class InMemoryRouteInfoRepository implements IRouteInfoRepository {
    async findByRouteId(routeId: string): Promise<SavedRouteInfo[]> {
        return (memoryRouteInfos as SavedRouteInfo[]).filter((item) => item.routeId === routeId)
    }

    async create(routeInfo: NewRouteInfo): Promise<SavedRouteInfo> {
        const saved: SavedRouteInfo = {
            routeInfoId: routeInfo.routeInfoId,
            routeId: routeInfo.routeId,
            userId: routeInfo.userId,
            name: routeInfo.name,
            description: routeInfo.description,
            lng: Number(routeInfo.lng),
            lat: Number(routeInfo.lat),
            elevation: routeInfo.elevation != null ? Number(routeInfo.elevation) : undefined,
            authorName: routeInfo.authorName,
            createdAt: new Date().toISOString()
        }
        ;(memoryRouteInfos as SavedRouteInfo[]).push(saved)
        return saved
    }
}

export const routeInfoRepository: IRouteInfoRepository = new InMemoryRouteInfoRepository()
