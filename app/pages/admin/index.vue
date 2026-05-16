<script setup lang="ts">
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { hasDeveloperAccess } from '../../../shared/constants/roles'

definePageMeta({ ssr: false })

const { user } = useAuthStore()
const showUmlCard = computed(() => import.meta.dev && hasDeveloperAccess(user.value?.role))

const { data: seedStatus } = await useFetch('/api/admin/seed/status')

const isConfirmOpen = ref(false)
const isRunning = ref(false)
const runResult = ref<{ success: boolean; executedAt: string; message: string } | null>(null)

async function runSeed() {
    isConfirmOpen.value = false
    isRunning.value = true
    try {
        const result = await $fetch<{ success: boolean; executedAt: string; message: string }>(
            '/api/admin/seed/run',
            { method: 'POST' }
        )
        runResult.value = result
    } catch {
        runResult.value = {
            success: false,
            executedAt: new Date().toISOString(),
            message: '시드 실행 실패. 서버 로그를 확인하세요.'
        }
    } finally {
        isRunning.value = false
    }
}
</script>

<template>
    <div class="container mx-auto p-6">
        <header class="mb-6">
            <h1 class="text-2xl font-semibold">관리자 대시보드</h1>
            <p class="text-sm text-(--ui-text-muted) mt-1">관리자/개발자용 운영 도구입니다.</p>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard>
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-database" class="w-5 h-5" />
                        <h2 class="font-medium">시드 관리</h2>
                    </div>
                </template>

                <div class="space-y-4">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-(--ui-text-muted)">DB 모드</span>
                        <UBadge
                            :color="seedStatus?.dbMode === 'POSTGRES' ? 'success' : 'warning'"
                            variant="subtle"
                        >
                            {{ seedStatus?.dbMode ?? '확인 중...' }}
                        </UBadge>
                    </div>

                    <UButton
                        color="neutral"
                        variant="outline"
                        :loading="isRunning"
                        :disabled="isRunning"
                        icon="i-lucide-play"
                        @click="isConfirmOpen = true"
                    >
                        시드 재실행
                    </UButton>

                    <div
                        v-if="runResult"
                        class="text-sm rounded-lg p-3 border"
                        :class="
                            runResult.success
                                ? 'border-(--ui-color-success-200) bg-(--ui-color-success-50) dark:bg-(--ui-color-success-950)'
                                : 'border-(--ui-color-error-200) bg-(--ui-color-error-50) dark:bg-(--ui-color-error-950)'
                        "
                    >
                        <p
                            :class="
                                runResult.success
                                    ? 'text-(--ui-color-success-700) dark:text-(--ui-color-success-300)'
                                    : 'text-(--ui-color-error-700) dark:text-(--ui-color-error-300)'
                            "
                        >
                            {{ runResult.message }}
                        </p>
                        <p class="text-(--ui-text-muted) text-xs mt-1">
                            {{ new Date(runResult.executedAt).toLocaleString('ko-KR') }}
                        </p>
                    </div>
                </div>
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

            <NuxtLink v-if="showUmlCard" to="/dev/uml" class="block">
                <UCard :ui="{ root: 'hover:ring-2 hover:ring-primary-500 transition' }">
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-git-graph" class="w-5 h-5" />
                            <h2 class="font-medium">UML Dashboard</h2>
                            <UBadge color="info" variant="subtle" size="xs" class="ml-auto">
                                개발 전용
                            </UBadge>
                        </div>
                    </template>
                    <p class="text-sm text-(--ui-text-muted)">
                        프로젝트 구조 시각화 (DEVELOPER 권한 · 개발 모드 전용).
                    </p>
                </UCard>
            </NuxtLink>
        </div>

        <UModal v-model:open="isConfirmOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon
                                name="i-lucide-alert-triangle"
                                class="w-5 h-5 text-warning-500"
                            />
                            <h3 class="font-medium">시드 재실행 확인</h3>
                        </div>
                    </template>

                    <div class="space-y-2 text-sm text-(--ui-text-muted)">
                        <p>
                            최고관리자 계정을 다시 시드합니다. 기존 계정 데이터는 환경변수 값으로
                            업데이트됩니다.
                        </p>
                        <p>
                            시설물 데이터는 CLI
                            <code class="font-mono bg-(--ui-bg-muted) px-1 rounded">pnpm seed</code
                            >를 사용하세요.
                        </p>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="isConfirmOpen = false"
                            >
                                취소
                            </UButton>
                            <UButton color="error" @click="runSeed">실행</UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
