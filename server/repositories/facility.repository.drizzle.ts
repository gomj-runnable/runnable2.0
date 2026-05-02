import { sql } from 'drizzle-orm'
import type { Facility, FacilityType } from '#shared/types/facility'
import type { IFacilityRepository } from './facility.repository'
import { facilities } from '../database/schema/facilities'
import { db as _db } from '../utils/db'

function getDb() {
    if (!_db) throw new Error('DrizzleFacilityRepository requires a database connection')
    return _db
}

function toFacility(row: typeof facilities.$inferSelect): Facility {
    return {
        id: row.id,
        type: row.type as FacilityType,
        name: row.name,
        description: row.description ?? undefined,
        lng: Number(row.lng),
        lat: Number(row.lat),
        hours: row.hours ?? undefined,
        tel: row.tel ?? undefined
    }
}

export const facilityRepository: IFacilityRepository = {
    async findNearby(lat, lng, radius, types) {
        const db = getDb()
        const typesArray = `{${types.join(',')}}`
        const rows = await db.execute(sql`
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
    },

    async findAll() {
        const db = getDb()
        const rows = await db.select().from(facilities)
        return rows.map(toFacility)
    }
}
