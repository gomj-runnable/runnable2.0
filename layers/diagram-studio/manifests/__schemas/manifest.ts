import { z } from 'zod'

/**
 * User Journey manifest 스키마.
 *
 * 형식 예시:
 * ```yaml
 * steps:
 *   - id: enter
 *     label: 앱 진입
 *     next: [auth]
 * ```
 */
export const userJourneyStepSchema = z.object({
    id: z.string().min(1, 'step.id 는 빈 문자열일 수 없습니다.'),
    label: z.string().min(1, 'step.label 은 빈 문자열일 수 없습니다.'),
    next: z.array(z.string()).default([])
})

export const userJourneyManifestSchema = z.object({
    steps: z.array(userJourneyStepSchema).min(1, 'steps 배열에 최소 1개 항목이 필요합니다.')
})

export type UserJourneyStep = z.infer<typeof userJourneyStepSchema>
export type UserJourneyManifest = z.infer<typeof userJourneyManifestSchema>

/**
 * zod 검증 실패 시 한글 에러 메시지로 변환.
 */
export function formatZodError(error: z.ZodError, filePath?: string): string {
    const lines = error.issues.map((issue) => {
        const path = issue.path.join('.') || '<root>'
        return `  • ${path}: ${issue.message}`
    })
    const header = filePath ? `[manifest] ${filePath} 검증 실패:` : '[manifest] 검증 실패:'
    return [header, ...lines].join('\n')
}
