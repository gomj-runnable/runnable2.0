import { createAuthClient } from 'better-auth/vue'
import { defineDeveloperGate, defineAdminGate } from '~/shared/lib/auth-gate'
import { hasAdminAccess, hasDeveloperAccess } from '../../shared/constants/roles'

export default defineNuxtPlugin(() => {
    const client = createAuthClient({ baseURL: window.location.origin })

    // 같은 라우트 전환 동안 admin/developer 두 게이트가 동시에 호출될 수 있으므로
    // in-flight 요청을 캐싱해 중복 세션 fetch 를 막는다. 다음 마이크로태스크에 해제.
    let pending: Promise<number | undefined> | null = null
    async function getRole(): Promise<number | undefined> {
        if (pending) return pending
        pending = (async () => {
            const { data } = await client.getSession()
            if (!data?.user) return undefined
            return (data.user as typeof data.user & { role?: number }).role
        })()
        try {
            return await pending
        } finally {
            queueMicrotask(() => {
                pending = null
            })
        }
    }

    defineDeveloperGate(async () => hasDeveloperAccess(await getRole()))
    defineAdminGate(async () => hasAdminAccess(await getRole()))
})
