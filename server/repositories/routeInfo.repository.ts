// 경로정보 Repository — 인터페이스 정의 + Drizzle ORM 구현 (Postgres/PostGIS)
// 위치는 PostGIS geometry(PointZ,4326) 의 geom 컬럼에 저장하고, ST_MakePoint/ST_AsGeoJSON 으로 입출력한다.
import { sql } from 'drizzle-orm'
import type { SavedRouteInfo } from '#shared/types/routeInfo'
import type { GeoJsonPoint } from '#shared/types/geojson'
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
    /** 위치 — GeoJSON Point. coordinates = [lng, lat] 또는 [lng, lat, elevation] */
    geom: GeoJsonPoint
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

/** route_infos 기본 행 (+ ST_AsGeoJSON(geom) 문자열 포함) */
interface RouteInfoRow {
    route_info_id: string
    route_id: string
    user_id: string
    name: string
    description: string
    author_name: string
    created_at: Date | string
    geom: string | null
}

/** ST_AsGeoJSON 결과 문자열을 GeoJSON Point 로 파싱한다. geom 이 비면 원점으로 폴백. */
const parsePointGeom = (raw: string | null): GeoJsonPoint => {
    if (raw) {
        try {
            const parsed = JSON.parse(raw)
            if (parsed?.type === 'Point') return parsed as GeoJsonPoint
        } catch {
            console.warn('[routeInfo.repository] JSON.parse failed for geom')
        }
    }
    return { type: 'Point', coordinates: [0, 0] }
}

const toSavedRouteInfo = (row: RouteInfoRow): SavedRouteInfo => ({
    routeInfoId: row.route_info_id,
    routeId: row.route_id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    geom: parsePointGeom(row.geom),
    authorName: row.author_name,
    createdAt: new Date(row.created_at).toISOString()
})

const SELECT_COLUMNS = sql`route_info_id, route_id, user_id, name, description, author_name, created_at, ST_AsGeoJSON(geom) AS geom`

export class DrizzleRouteInfoRepository implements IRouteInfoRepository {
    constructor(private readonly db: Db) {}

    async findByRouteId(routeId: string): Promise<SavedRouteInfo[]> {
        const result = await this.db.execute(sql`
            SELECT ${SELECT_COLUMNS}
            FROM route_infos
            WHERE route_id = ${routeId}
            ORDER BY created_at
        `)
        return (result.rows as unknown as RouteInfoRow[]).map(toSavedRouteInfo)
    }

    async create(routeInfo: NewRouteInfo): Promise<SavedRouteInfo> {
        const [lng, lat, elevation] = routeInfo.geom.coordinates
        return this.db.transaction(async (tx) => {
            // 비공간 컬럼은 Drizzle 빌더로, geom 은 PostGIS 함수로 분리 저장(facilities 패턴)
            await tx.insert(routeInfos).values({
                routeInfoId: routeInfo.routeInfoId,
                routeId: routeInfo.routeId,
                userId: routeInfo.userId,
                name: routeInfo.name,
                description: routeInfo.description,
                authorName: routeInfo.authorName
            })
            await tx.execute(sql`
                UPDATE route_infos
                SET geom = ST_SetSRID(ST_MakePoint(${lng}, ${lat}, ${elevation ?? 0}), 4326)
                WHERE route_info_id = ${routeInfo.routeInfoId}
            `)
            const result = await tx.execute(sql`
                SELECT ${SELECT_COLUMNS}
                FROM route_infos
                WHERE route_info_id = ${routeInfo.routeInfoId}
            `)
            const row = (result.rows as unknown as RouteInfoRow[])[0]
            if (!row) throw new Error('Failed to create routeInfo')
            return toSavedRouteInfo(row)
        })
    }
}
