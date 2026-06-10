// 경로 정보 핀 생성 Zod 검증 스키마
import { z } from 'zod'
import { geoJsonPointSchema } from './route.schema'

export const createRouteInfoSchema = z.object({
    name: z.string().min(1, '장소명을 입력해주세요').max(100, '장소명은 최대 100자까지 가능합니다'),
    description: z
        .string()
        .min(1, '설명을 입력해주세요')
        .max(500, '설명은 최대 500자까지 가능합니다'),
    // 위치 — GeoJSON Point. coordinates = [lng, lat] 또는 [lng, lat, elevation]
    geom: geoJsonPointSchema
})
