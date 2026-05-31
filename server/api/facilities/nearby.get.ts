// GET /api/facilities/nearby - 좌표 기준 반경 내 시설물 조회 (lat, lng, radius, types)
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { getFacilityRepository } from '../../repositories'
import { withExceptionHandler } from '../../utils/error'
import type { FacilityType } from '#shared/types/facility'

const VALID_TYPES = ['crosswalk', 'fountain', 'hospital', 'toilet', 'locker'] as const

const nearbySchema = z.object({
    lat: z.coerce.number().finite().min(-90).max(90),
    lng: z.coerce.number().finite().min(-180).max(180),
    radius: z.coerce.number().positive().max(5000).default(1000),
    types: z.string().optional()
})

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const { lat, lng, radius, types } = nearbySchema.parse(getQuery(event))

        const requestedTypes = types
            ? (types.split(',').filter((t) => VALID_TYPES.includes(t as any)) as FacilityType[])
            : ([...VALID_TYPES] as FacilityType[])

        return (await getFacilityRepository()).findNearby(lat, lng, radius, requestedTypes)
    })
)
