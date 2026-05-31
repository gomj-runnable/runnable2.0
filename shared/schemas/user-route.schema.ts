// 사용자 페이스(UserPace) Zod 검증 스키마
import { z } from 'zod'

export const userPaceSchema = z.object({
    userPaceId: z.string(),
    userRouteId: z.string(),
    sectionId: z.string(),
    pace: z.int().optional(),
    weight: z.number().optional(),
    strategy: z.string().optional()
})

export const createUserPaceSchema = userPaceSchema.omit({
    userPaceId: true,
    userRouteId: true
})

export type UserPace = z.infer<typeof userPaceSchema>
export type CreateUserPaceInput = z.infer<typeof createUserPaceSchema>
