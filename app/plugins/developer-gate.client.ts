// 클라이언트 전용 플러그인 — developer/admin 권한 게이트를 better-auth 세션 기반으로 등록한다.
import { createAuthClient } from 'better-auth/vue'
import { defineDeveloperGate, defineAdminGate } from '~/shared/lib/auth-gate'
import { hasPermission, Permission } from '../../shared/constants/permissions'

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

    defineDeveloperGate(async () => hasPermission(await getRole(), Permission.VIEW_DEV_PAGE))
    defineAdminGate(async () => hasPermission(await getRole(), Permission.VIEW_ADMIN_PAGE))
})
