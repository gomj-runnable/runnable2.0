/** BetterAuth additionalFields 외 러너 도메인 추가 필드 */
export interface UserRunnerFields {
    age?: number
    runnerSince?: string
    paceAverage?: number // integer (초 단위)
    isDeleted: 'Y' | 'N'
}
