<script setup lang="ts">
import type {
    SavedCurationCollection,
    CurationCollectionDraftInput,
    CurationSeason,
    CurationTheme
} from '../../../shared/types/curation'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

const notification = useNotificationStore()

definePageMeta({ ssr: false })

const { data: collections, refresh } = await useFetch<SavedCurationCollection[]>('/api/curation')

const isCreateOpen = ref(false)
const isSubmitting = ref(false)

const seasonOptions: { label: string; value: CurationSeason }[] = [
    { label: '봄', value: 'spring' },
    { label: '여름', value: 'summer' },
    { label: '가을', value: 'autumn' },
    { label: '겨울', value: 'winter' }
]

const themeOptions: { label: string; value: CurationTheme }[] = [
    { label: '벚꽃', value: 'cherry-blossom' },
    { label: '단풍', value: 'autumn-leaves' },
    { label: '일출', value: 'sunrise' },
    { label: '일몰', value: 'sunset' },
    { label: '야경', value: 'night-view' },
    { label: '그늘', value: 'shade' },
    { label: '강변', value: 'riverside' }
]

const form = reactive<CurationCollectionDraftInput>({
    title: '',
    description: '',
    season: 'spring',
    theme: 'cherry-blossom',
    validFrom: '',
    validTo: '',
    coverImageUrl: ''
})

function resetForm() {
    form.title = ''
    form.description = ''
    form.season = 'spring'
    form.theme = 'cherry-blossom'
    form.validFrom = ''
    form.validTo = ''
    form.coverImageUrl = ''
}

async function createCollection() {
    isSubmitting.value = true
    try {
        await $fetch('/api/curation', { method: 'POST', body: form })
        isCreateOpen.value = false
        resetForm()
        await refresh()
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '생성 실패'
        notification.notify({
            title: '컬렉션 생성 실패',
            message: msg,
            tone: NotificationToneEnum.ERROR
        })
    } finally {
        isSubmitting.value = false
    }
}

async function deleteCollection(collectionId: string) {
    if (!confirm('이 컬렉션을 삭제하시겠습니까?')) return
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ($fetch as any)(`/api/curation/${collectionId}`, { method: 'DELETE' })
        await refresh()
    } catch {
        notification.notify({
            title: '삭제 실패',
            message: '컬렉션 삭제에 실패했습니다.',
            tone: NotificationToneEnum.ERROR
        })
    }
}

const seasonLabel = (s: CurationSeason) => seasonOptions.find((o) => o.value === s)?.label ?? s
const themeLabel = (t: CurationTheme) => themeOptions.find((o) => o.value === t)?.label ?? t
</script>

<template>
    <div class="container mx-auto p-6">
        <header class="mb-6 flex items-center justify-between">
            <div>
                <NuxtLink to="/admin" class="text-sm text-(--ui-text-muted) hover:underline">
                    &larr; 관리자 대시보드
                </NuxtLink>
                <h1 class="text-2xl font-semibold mt-1">큐레이션 관리</h1>
                <p class="text-sm text-(--ui-text-muted) mt-1">
                    계절·시간대별 경로 큐레이션 컬렉션을 관리합니다.
                </p>
            </div>
            <div class="flex items-center gap-2">
                <UColorModeButton />
                <UButton icon="i-lucide-plus" @click="isCreateOpen = true">새 컬렉션</UButton>
            </div>
        </header>

        <div v-if="!collections?.length" class="text-center py-12 text-(--ui-text-muted)">
            <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>등록된 큐레이션이 없습니다.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard v-for="col in collections" :key="col.collectionId">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="font-medium truncate">{{ col.title }}</h3>
                        <UButton
                            icon="i-lucide-trash-2"
                            color="error"
                            variant="ghost"
                            size="xs"
                            aria-label="컬렉션 삭제"
                            @click="deleteCollection(col.collectionId)"
                        />
                    </div>
                </template>
                <div class="space-y-2 text-sm">
                    <p v-if="col.description" class="text-(--ui-text-muted)">
                        {{ col.description }}
                    </p>
                    <div class="flex gap-2 flex-wrap">
                        <UBadge variant="subtle" color="success">{{
                            seasonLabel(col.season)
                        }}</UBadge>
                        <UBadge variant="subtle" color="info">{{ themeLabel(col.theme) }}</UBadge>
                    </div>
                    <div class="text-xs text-(--ui-text-muted)">
                        {{ col.validFrom }} ~ {{ col.validTo }} · 경로 {{ col.routeCount }}개
                    </div>
                </div>
            </UCard>
        </div>

        <UModal v-model:open="isCreateOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <h3 class="font-medium">새 큐레이션 컬렉션</h3>
                    </template>

                    <form class="space-y-4" @submit.prevent="createCollection">
                        <UInput v-model="form.title" placeholder="컬렉션 제목" required />
                        <UTextarea v-model="form.description" placeholder="설명 (선택)" />

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-(--ui-text-muted) mb-1 block"
                                    >시즌</label
                                >
                                <select
                                    v-model="form.season"
                                    class="w-full rounded-md border border-(--ui-border) bg-(--ui-bg) px-3 py-2 text-sm"
                                >
                                    <option
                                        v-for="opt in seasonOptions"
                                        :key="opt.value"
                                        :value="opt.value"
                                    >
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs text-(--ui-text-muted) mb-1 block"
                                    >테마</label
                                >
                                <select
                                    v-model="form.theme"
                                    class="w-full rounded-md border border-(--ui-border) bg-(--ui-bg) px-3 py-2 text-sm"
                                >
                                    <option
                                        v-for="opt in themeOptions"
                                        :key="opt.value"
                                        :value="opt.value"
                                    >
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <UInput v-model="form.validFrom" type="date" label="시작일" required />
                            <UInput v-model="form.validTo" type="date" label="종료일" required />
                        </div>

                        <UInput v-model="form.coverImageUrl" placeholder="커버 이미지 URL (선택)" />

                        <div class="flex justify-end gap-2 pt-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="isCreateOpen = false"
                            >
                                취소
                            </UButton>
                            <UButton type="submit" :loading="isSubmitting">생성</UButton>
                        </div>
                    </form>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
