import { z } from 'zod'

export const createRouteInfoSchema = z.object({
    name: z.string().min(1, '장소명을 입력해주세요').max(100, '장소명은 최대 100자까지 가능합니다'),
    description: z.string().min(1, '설명을 입력해주세요').max(500, '설명은 최대 500자까지 가능합니다'),
    lng: z.number(),
    lat: z.number(),
    elevation: z.number().optional()
})

export type CreateRouteInfoSchema = z.infer<typeof createRouteInfoSchema>
