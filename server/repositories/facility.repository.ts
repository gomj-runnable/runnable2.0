// 시설물 Repository — 인터페이스 정의 + Drizzle ORM 구현 (Postgres/PostGIS)
import { sql, inArray } from 'drizzle-orm'
import type {
    Facility,
    FacilityType,
    FacilityAttribute,
    FacilityReference,
    FacilityGeometry
} from '#shared/types/facility'
import type { getDb } from '../database/client'
import { facilities } from '../database/schema/facilities'
import {
    crosswalkAttribute,
    toiletAttribute,
    hospitalAttribute
} from '../database/schema/facilityAttributes'
import { facilityReference } from '../database/schema/facilityReference'

export interface IFacilityRepository {
    findNearby(lat: number, lng: number, radius: number, types: FacilityType[]): Promise<Facility[]>
    findAll(): Promise<Facility[]>
}

type Db = Awaited<ReturnType<typeof getDb>>

/** facilities 기본 행 (+ ST_AsGeoJSON(geom) 문자열 포함) */
interface FacilityBaseRow {
    id: string
    type: string
    name: string
    description: string | null
    geom?: string | null
}

/** ST_AsGeoJSON 결과 문자열을 Point/LineString geometry 로 파싱한다. */
function parseGeometry(geom?: string | null): FacilityGeometry | undefined {
    if (!geom) return undefined
    try {
        const parsed = JSON.parse(geom)
        if (parsed?.type === 'Point' || parsed?.type === 'LineString') {
            return parsed as FacilityGeometry
        }
        return undefined
    } catch {
        return undefined
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
            SELECT id, type, name, description, ST_AsGeoJSON(geom) AS geom
            FROM facilities
            WHERE type = ANY(${typesArray}::text[])
              AND geom IS NOT NULL
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
        return this.assemble(rows.rows as unknown as FacilityBaseRow[])
    }

    async findAll(): Promise<Facility[]> {
        const rows = await this.db.execute(sql`
            SELECT id, type, name, description, ST_AsGeoJSON(geom) AS geom FROM facilities
        `)
        return this.assemble(rows.rows as unknown as FacilityBaseRow[])
    }

    /** 기본 행에 종류별 속성·참조를 결합해 Facility[] 로 조립한다. */
    private async assemble(rows: FacilityBaseRow[]): Promise<Facility[]> {
        if (rows.length === 0) return []
        const ids = rows.map((r) => r.id)

        const [crosswalkRows, toiletRows, hospitalRows, refRows] = await Promise.all([
            this.db
                .select()
                .from(crosswalkAttribute)
                .where(inArray(crosswalkAttribute.facilityId, ids)),
            this.db.select().from(toiletAttribute).where(inArray(toiletAttribute.facilityId, ids)),
            this.db
                .select()
                .from(hospitalAttribute)
                .where(inArray(hospitalAttribute.facilityId, ids)),
            this.db
                .select()
                .from(facilityReference)
                .where(inArray(facilityReference.facilityId, ids))
        ])

        // 종류별 타입 컬럼을 공통 attributes 배열로 정규화한다(앱 계층 일반화 유지).
        const attrMap = new Map<string, FacilityAttribute[]>()
        for (const r of crosswalkRows) {
            if (r.hasSignal != null) {
                attrMap.set(r.facilityId, [
                    { name: 'hasSignal', type: 'boolean', value: String(r.hasSignal) }
                ])
            }
        }
        const addHoursTel = (r: {
            facilityId: string
            hours: string | null
            tel: string | null
        }) => {
            const list: FacilityAttribute[] = []
            if (r.hours != null) list.push({ name: 'hours', type: 'string', value: r.hours })
            if (r.tel != null) list.push({ name: 'tel', type: 'string', value: r.tel })
            if (list.length) attrMap.set(r.facilityId, list)
        }
        for (const r of toiletRows) addHoursTel(r)
        for (const r of hospitalRows) addHoursTel(r)

        const refMap = new Map<string, FacilityReference[]>()
        for (const r of refRows) {
            const list = refMap.get(r.facilityId) ?? []
            list.push({ name: r.name, url: r.url })
            refMap.set(r.facilityId, list)
        }

        return rows.map((row) => {
            const facility: Facility = {
                id: row.id,
                type: row.type as FacilityType,
                name: row.name,
                description: row.description ?? undefined,
                attributes: attrMap.get(row.id) ?? [],
                references: refMap.get(row.id) ?? []
            }
            const geometry = parseGeometry(row.geom)
            if (geometry) facility.geometry = geometry
            return facility
        })
    }
}
