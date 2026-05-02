import { defineEventHandler, getQuery } from 'h3'
import { seoulFacilities } from '../../data/facilities'
import { haversineDistance } from '../../utils/haversine'
import type { FacilityType } from '#shared/types/facility'

/** 검색 반경 기본값 (미터) */
const DEFAULT_RADIUS_M = 1000 // 1km

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
        : (['crosswalk', 'fountain', 'hospital', 'toilet'] as FacilityType[])

    return seoulFacilities.filter((f) => {
        if (!requestedTypes.includes(f.type)) return false
        return haversineDistance(lat, lng, f.lat, f.lng) <= DEFAULT_RADIUS_M
    })
})
