// IFacilityRepository의 Drizzle ORM 구현체 — POSTGRES/PGlite 모드 분기 처리 포함
import { sql } from 'drizzle-orm'
import type { Facility, FacilityType } from '#shared/types/facility'
import type { IFacilityRepository } from './facility.repository'
import type { getDb } from '../database/client'
import { facilities } from '../database/schema/facilities'
import { haversineDistance } from '../utils/haversine'
import { getDbMode, DATABASE_MODE } from '../config/dbMode'

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
        if (getDbMode() === DATABASE_MODE.PGLITE) {
            return this.findNearbyPglite(lat, lng, radius, types)
        }
        return this.findNearbyPostgres(lat, lng, radius, types)
    }

    private async findNearbyPostgres(
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

    private async findNearbyPglite(
        lat: number,
        lng: number,
        radius: number,
        types: FacilityType[]
    ): Promise<Facility[]> {
        // Bounding-box pre-filter on numeric lat/lng, then JS-side haversine for exact distance.
        // 양극(lat = ±90°) 부근에서 cos(lat) ≈ 0 이라 0 으로 나눔이 발생하지 않도록 floor 적용.
        const latDelta = radius / 111_320
        const lngDelta =
            radius / (111_320 * Math.max(Math.abs(Math.cos((lat * Math.PI) / 180)), 1e-6))

        const rows = await this.db.execute(sql`
            SELECT *
            FROM facilities
            WHERE type = ANY(ARRAY[${sql.join(
                types.map((t) => sql`${t}`),
                sql`, `
            )}]::text[])
              AND lat BETWEEN ${lat - latDelta} AND ${lat + latDelta}
              AND lng BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}
        `)

        return (rows.rows as (typeof facilities.$inferSelect)[])
            .map(toFacility)
            .filter((f) => haversineDistance(lat, lng, f.lat, f.lng) <= radius)
            .sort(
                (a, b) =>
                    haversineDistance(lat, lng, a.lat, a.lng) -
                    haversineDistance(lat, lng, b.lat, b.lng)
            )
    }

    async findAll(): Promise<Facility[]> {
        const rows = await this.db.select().from(facilities)
        return rows.map(toFacility)
    }
}
