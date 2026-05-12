<script setup lang="ts">
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
    <div class="container mx-auto p-6">
        <header class="mb-6">
            <h1 class="text-2xl font-semibold">관리자 대시보드</h1>
            <p class="text-sm text-(--ui-text-muted) mt-1">관리자/개발자용 운영 도구입니다.</p>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Diagram Studio (DEVELOPER 전용) -->
            <UCard :ui="{ root: 'hover:ring-2 hover:ring-primary-500 transition' }">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-network" class="w-5 h-5" />
                        <h2 class="font-medium">Diagram Studio</h2>
                    </div>
                </template>
                <p class="text-sm text-(--ui-text-muted)">
                    프로젝트 구조 시각화 도구 (DEVELOPER 권한 필요).
                </p>
                <template #footer>
                    <UButton
                        to="/admin/diagrams"
                        variant="solid"
                        :disabled="!hasDeveloperAccess(authStore.user.value?.role)"
                        block
                    >
                        이동
                    </UButton>
                </template>
            </UCard>

            <!-- Placeholder cards (준비 중) -->
            <UCard class="opacity-60 cursor-not-allowed">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-database" class="w-5 h-5" />
                        <h2 class="font-medium">시드 관리</h2>
                    </div>
                </template>
                <p class="text-sm text-(--ui-text-muted)">준비 중</p>
            </UCard>

            <UCard class="opacity-60 cursor-not-allowed">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-users" class="w-5 h-5" />
                        <h2 class="font-medium">세션 관리</h2>
                    </div>
                </template>
                <p class="text-sm text-(--ui-text-muted)">준비 중</p>
            </UCard>
        </div>
    </div>
</template>
