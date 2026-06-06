// 시설물 Repository — 인터페이스 정의 + Drizzle ORM 구현 (Postgres/PostGIS)
import { sql } from 'drizzle-orm'
import type { Facility, FacilityType } from '#shared/types/facility'
import type { getDb } from '../database/client'
import { facilities } from '../database/schema/facilities'

export interface IFacilityRepository {
    findNearby(lat: number, lng: number, radius: number, types: FacilityType[]): Promise<Facility[]>
    findAll(): Promise<Facility[]>
}

type Db = Awaited<ReturnType<typeof getDb>>

function toFacility(row: typeof facilities.$inferSelect): Facility {
    return {
        id: row.id,
        type: row.type as FacilityType,
        name: row.name,
        description: row.description ?? undefined,
        lng: Number(row.lng),
        lat: Number(row.lat),
        hours: row.hours ?? undefined,
        tel: row.tel ?? undefined,
        ...(row.hasSignal !== null && { hasSignal: row.hasSignal }),
        ...(row.polyline && { polyline: row.polyline })
    }
}

export class DrizzleFacilityRepository implements IFacilityRepository {
    constructor(private readonly db: Db) {}

    async findNearby(
        lat: number,
        lng: number,
        radius: number,
        types: FacilityType[]
    ): Promise<Facility[]> {
        const typesArray = `{${types.join(',')}}`
        const rows = await this.db.execute(sql`
            SELECT *
            FROM facilities
            WHERE type = ANY(${typesArray}::text[])
              AND ST_DWithin(
                    geom,
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                    ${radius}
                  )
            ORDER BY ST_Distance(
                geom,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            )
        `)
        return rows.rows.map((r) => toFacility(r as typeof facilities.$inferSelect))
    }

    async findAll(): Promise<Facility[]> {
        const rows = await this.db.select().from(facilities)
        return rows.map(toFacility)
    }
}
