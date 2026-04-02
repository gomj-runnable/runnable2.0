import { createAuthClient } from 'better-auth/vue'

/**
 * 클라이언트 수준에서 authClient 정의 (최초 1회)
 */
const authClient = createAuthClient()

/**
 * 전역 getter 정의
 */
export function useAuthClient() {
    return authClient
}
