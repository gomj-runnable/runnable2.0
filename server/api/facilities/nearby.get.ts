import { defineEventHandler, getQuery, createError } from 'h3'
import { facilityRepository } from '../../repositories'
import type { FacilityType } from '#shared/types/facility'

/** 검색 반경 기본값 (미터) */
const DEFAULT_RADIUS_M = 1000

export default defineEventHandler(async (event) => {
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

    return facilityRepository.findNearby(lat, lng, radius, requestedTypes)
})
