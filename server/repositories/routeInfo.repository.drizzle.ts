import { eq } from 'drizzle-orm'
import type { IRouteInfoRepository, NewRouteInfo, SavedRouteInfo } from './routeInfo.repository'
import { db as _db } from '../utils/db'
import { routeInfos } from '../database/schema/routeInfos'

function getDb() {
    if (!_db) throw new Error('DrizzleRouteInfoRepository requires a database connection')
    return _db
}

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

class DrizzleRouteInfoRepository implements IRouteInfoRepository {
    async findByRouteId(routeId: string): Promise<SavedRouteInfo[]> {
        const rows = await getDb()
            .select()
            .from(routeInfos)
            .where(eq(routeInfos.routeId, routeId))
            .orderBy(routeInfos.createdAt)

        return rows.map(toSavedRouteInfo)
    }

    async create(routeInfo: NewRouteInfo): Promise<SavedRouteInfo> {
        const [row] = await getDb()
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

export const routeInfoRepository: IRouteInfoRepository = new DrizzleRouteInfoRepository()
