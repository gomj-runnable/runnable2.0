import { z } from 'zod'

export const createFeedbackSchema = z.object({
    content: z.string().min(1, '피드백 내용을 입력해주세요').max(500, '피드백은 최대 500자까지 가능합니다'),
    longitude: z.number(),
    latitude: z.number(),
    elevation: z.number().optional(),
    authorName: z.string().max(100).optional()
})

export type CreateFeedbackSchema = z.infer<typeof createFeedbackSchema>
