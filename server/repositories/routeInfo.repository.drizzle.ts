import { eq } from 'drizzle-orm'
import type { IRouteInfoRepository, NewRouteInfo, SavedRouteInfo } from './routeInfo.repository'
import type { getDb } from '../database/client'
import { routeInfos } from '../database/schema/routeInfos'

type Db = Awaited<ReturnType<typeof getDb>>

const toSavedRouteInfo = (row: typeof routeInfos.$inferSelect): SavedRouteInfo => ({
    routeInfoId: row.routeInfoId,
    routeId: row.routeId,
    userId: row.userId,
    name: row.name,
    description: row.description,
    lng: Number(row.lng),
    lat: Number(row.lat),
    elevation: row.elevation != null ? Number(row.elevation) : undefined,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString()
})

export class DrizzleRouteInfoRepository implements IRouteInfoRepository {
    constructor(private readonly db: Db) {}

    async findByRouteId(routeId: string): Promise<SavedRouteInfo[]> {
        const rows = await this.db
            .select()
            .from(routeInfos)
            .where(eq(routeInfos.routeId, routeId))
            .orderBy(routeInfos.createdAt)
        return rows.map(toSavedRouteInfo)
    }

    async create(routeInfo: NewRouteInfo): Promise<SavedRouteInfo> {
        const [row] = await this.db
            .insert(routeInfos)
            .values({
                routeInfoId: routeInfo.routeInfoId,
                routeId: routeInfo.routeId,
                userId: routeInfo.userId,
                name: routeInfo.name,
                description: routeInfo.description,
                lng: routeInfo.lng,
                lat: routeInfo.lat,
                elevation: routeInfo.elevation,
                authorName: routeInfo.authorName
            })
            .returning()

        if (!row) throw new Error('Failed to create routeInfo')
        return toSavedRouteInfo(row)
    }
}
