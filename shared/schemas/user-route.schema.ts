import { z } from 'zod'

export const createUserRouteSchema = z.object({
    userId: z.string().min(1),
    categoryId: z.string().min(1),
    routeId: z.string().min(1)
})

export const createUserPaceSchema = z.object({
    userRouteId: z.string().min(1),
    sectionId: z.string().min(1),
    pace: z.number().int().nonnegative().optional(),
    strategy: z.string().optional()
})

export type CreateUserRouteSchema = z.infer<typeof createUserRouteSchema>
export type CreateUserPaceSchema = z.infer<typeof createUserPaceSchema>
