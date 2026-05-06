import { z } from 'zod'
import type { Facility, FacilityType, PoiType } from '#shared/types/facility'
import { geoJsonPointSchema } from './route.schema'

export const facilityTypeSchema = z.enum([
    'crosswalk',
    'fountain',
    'locker',
    'hospital',
    'sidewalk',
    'toilet'
]) satisfies z.ZodType<FacilityType>

export const poiTypeSchema = z.enum(['HOSPITAL', 'CROSSWALK', 'WATER']) satisfies z.ZodType<PoiType>

export { geoJsonPointSchema }

export const facilitySchema = z.object({
    id: z.string(),
    type: facilityTypeSchema,
    name: z.string(),
    description: z.string().optional(),
    lng: z.number(),
    lat: z.number(),
    hours: z.string().optional(),
    tel: z.string().optional(),
    userId: z.string().optional(),
    hasSignal: z.boolean().optional(),
    polyline: z.array(z.tuple([z.number(), z.number()])).optional()
}) satisfies z.ZodType<Facility>
