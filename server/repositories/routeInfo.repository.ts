// 경로정보 Repository — 인터페이스 정의 + Drizzle ORM 구현 (경로 위치 정보 조회/생성)
import { eq } from 'drizzle-orm'
import type { SavedRouteInfo } from '#shared/types/routeInfo'
import type { getDb } from '../database/client'
import { routeInfos } from '../database/schema/routeInfos'

export type { SavedRouteInfo }

/** 새 경로정보 생성 입력 타입 */
export interface NewRouteInfo {
    routeInfoId: string
    routeId: string
    userId: string
    name: string
    description: string
    lng: string
    lat: string
    elevation: string | null
    authorName: string
}

/**
 * 경로정보 저장소 어댑터 인터페이스.
 * 구현체(InMemory, Postgres 등)만 교체하면 저장 방식을 변경할 수 있다.
 */
export interface IRouteInfoRepository {
    findByRouteId(routeId: string): Promise<SavedRouteInfo[]>
    create(routeInfo: NewRouteInfo): Promise<SavedRouteInfo>
}

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
