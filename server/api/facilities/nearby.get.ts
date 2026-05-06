import { defineEventHandler, getQuery } from 'h3'
import { facilityRepository } from '../../repositories'
import { badRequest } from '../../utils/error'
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
        throw badRequest('lat, lng 파라미터가 필요합니다')
    }

    const requestedTypes = typesParam
        ? (typesParam.split(',').filter(Boolean) as FacilityType[])
        : (['crosswalk', 'fountain', 'hospital', 'toilet'] as FacilityType[])

    return facilityRepository.findNearby(lat, lng, radius, requestedTypes)
})
