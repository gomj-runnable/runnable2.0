import { z } from 'zod'

export const sectionAttrSchema = z.object({
    seq: z.number().int().nonnegative(),
    speed: z.number().optional(),
    time: z.string().optional()
})

export const createSectionSchema = z.object({
    routeId: z.string().min(1),
    geom: z.string().optional(),
    attrs: z.array(sectionAttrSchema).optional()
})

export const createRouteSchema = z.object({
    title: z
        .string()
        .min(1, '경로 제목을 입력해주세요')
        .max(255, '경로 제목은 최대 255자까지 가능합니다'),
    descript: z.string().optional(),
    highHeight: z.number().optional(),
    lowHeight: z.number().optional(),
    distance: z.number().nonnegative().optional()
})

export type SectionAttrSchema = z.infer<typeof sectionAttrSchema>
export type CreateSectionSchema = z.infer<typeof createSectionSchema>
export type CreateRouteSchema = z.infer<typeof createRouteSchema>
