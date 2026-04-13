import { defineEventHandler, getQuery } from 'h3'
import { sampleFacilities } from '#shared/data/sample-facilities'
import type { FacilityType } from '#shared/types/facility'

/** 위도 1도 ≈ 111km, 검색 반경 기본값 (도 단위) */
const DEFAULT_RADIUS_DEG = 0.045 // ≈ 5km

export default defineEventHandler((event) => {
    const query = getQuery(event)
    const lat = parseFloat(query.lat as string)
    const lng = parseFloat(query.lng as string)
    const typesParam = (query.types as string) ?? ''

    if (isNaN(lat) || isNaN(lng)) {
        return []
    }

    const requestedTypes = typesParam
        ? (typesParam.split(',').filter(Boolean) as FacilityType[])
        : (['crosswalk', 'fountain', 'hospital'] as FacilityType[])

    return sampleFacilities.filter((f) => {
        if (!requestedTypes.includes(f.type)) return false

        const dlat = f.lat - lat
        const dlng = f.lng - lng
        const dist = Math.sqrt(dlat * dlat + dlng * dlng)

        return dist <= DEFAULT_RADIUS_DEG
    })
})
