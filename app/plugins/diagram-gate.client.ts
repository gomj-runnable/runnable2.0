import { createAuthClient } from 'better-auth/vue'
import { defineDeveloperGate } from '../../layers/diagram-studio/runtime/auth-gate'
import { ROLES } from '../../shared/constants/roles'

export default defineNuxtPlugin(() => {
    const client = createAuthClient({ baseURL: window.location.origin })

    defineDeveloperGate(async () => {
        const { data } = await client.getSession()
        if (!data?.user) return false
        const role = (data.user as typeof data.user & { role?: number }).role
        return role === ROLES.DEVELOPER
    })
})
