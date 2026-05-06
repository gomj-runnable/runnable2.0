import { z } from 'zod'

/** GeoJSON Position 좌표 스키마 (lng, lat, height). */
export const geoJsonPositionSchema = z.tuple([z.number(), z.number(), z.number()])
