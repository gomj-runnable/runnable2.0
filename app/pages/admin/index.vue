<script setup lang="ts">
/**
 * /admin 진입 허브.
 * - DEVELOPER(>=99): 자동으로 `/admin/diagrams` 로 리다이렉트.
 * - ADMIN(50): 사용 가능한 도구가 아직 없으므로 placeholder 안내.
 *
 * `app/middleware/admin-only.global.ts` 가 role >= ADMIN(50) 통과만 허용하므로
 * 이 페이지에 도달한 사용자는 항상 admin 또는 developer 권한 보유자다.
 */
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { hasDeveloperAccess } from '../../../shared/constants/roles'

definePageMeta({ ssr: false })

const authStore = useAuthStore()

onMounted(() => {
    if (hasDeveloperAccess(authStore.user.value?.role)) {
        navigateTo('/admin/diagrams', { replace: true })
    }
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-6">
        <div class="max-w-md text-center space-y-3">
            <UIcon
                name="i-lucide-shield"
                class="w-12 h-12 mx-auto text-(--ui-text-muted)"
                aria-hidden="true"
            />
            <h1 class="text-xl font-semibold">관리자 페이지</h1>
            <p class="text-sm text-(--ui-text-muted)">
                현재 사용 가능한 관리자 도구가 준비되지 않았습니다.<br />
                개발자 권한 계정으로는 Diagram Studio 진입이 가능합니다.
            </p>
            <UButton
                to="/"
                variant="outline"
                color="neutral"
                icon="i-lucide-arrow-left"
                label="메인으로 돌아가기"
            />
        </div>
    </div>
</template>
