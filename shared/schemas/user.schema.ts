import { z } from 'zod'

export const createUserSchema = z.object({
    name: z
        .string()
        .min(2, '사용자명은 최소 2자 이상이어야 합니다')
        .max(50, '사용자명은 최대 50자까지 가능합니다'),
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, '비밀번호는 8자 이상입니다.'),
    role: z.number().int()
})

export type CreateUserSchema = z.infer<typeof createUserSchema>
/** BetterAuth additionalFields 외 러너 도메인 추가 필드 */
export const userRunnerFieldsSchema = z.object({
    age: z.number().int().nonnegative().optional(),
    runnerSince: z.iso.datetime().optional(),
    paceAverage: z.number().int().nonnegative().optional(),
    isDeleted: z.enum(['Y', 'N']).default('N')
})
