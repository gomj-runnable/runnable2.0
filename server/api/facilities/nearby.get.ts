import { defineEventHandler, getQuery, createError } from 'h3'
import { seoulFacilities } from '../../data/facilities'
import { haversineDistance } from '../../utils/haversine'
import type { FacilityType } from '#shared/types/facility'

/** 검색 반경 기본값 (미터) */
const DEFAULT_RADIUS_M = 1000

export default defineEventHandler((event) => {
    const query = getQuery(event)
    const lat = parseFloat(query.lat as string)
    const lng = parseFloat(query.lng as string)
    const radius = Math.min(parseFloat(query.radius as string) || DEFAULT_RADIUS_M, 5000)
    const typesParam = (query.types as string) ?? ''

    if (isNaN(lat) || isNaN(lng)) {
        throw createError({ statusCode: 400, message: 'lat, lng 파라미터가 필요합니다' })
    }

    const requestedTypes = typesParam
        ? (typesParam.split(',').filter(Boolean) as FacilityType[])
        : (['crosswalk', 'fountain', 'hospital', 'toilet'] as FacilityType[])

    // Bounding Box 사전 필터링 → Haversine 계산 대상 축소
    const latDelta = radius / 111_320
    const lngDelta = radius / (111_320 * Math.cos((lat * Math.PI) / 180))

    return seoulFacilities.filter((f) => {
        if (!requestedTypes.includes(f.type)) return false
        if (Math.abs(f.lat - lat) > latDelta || Math.abs(f.lng - lng) > lngDelta) return false
        return haversineDistance(lat, lng, f.lat, f.lng) <= radius
    })
})
