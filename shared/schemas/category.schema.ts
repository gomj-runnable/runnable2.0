import { z } from 'zod'

export const createCategorySchema = z.object({
    name: z
        .string()
        .min(1, '카테고리명을 입력해주세요')
        .max(100, '카테고리명은 최대 100자까지 가능합니다')
})

export type CreateCategorySchema = z.infer<typeof createCategorySchema>
