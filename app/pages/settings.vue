<script setup lang="ts">
/**
 * 플러그인 설정 — 로그인 사용자가 플러그인을 켜고 끈다.
 * 상태는 /api/me/feature-prefs 에 영속된다. (epic #350 PR3)
 */
import { pluginRegistry } from '~/plugins-ext/registry'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useAuthSideeffect } from '~/entities/user/api/useAuthSideeffect'

definePageMeta({ ssr: false })

interface FeaturePref {
    pluginId: string
    enabled: boolean
}

const { isLoggedIn } = useAuthStore()
const { fetchSession } = useAuthSideeffect()
const toast = useToast()

const loading = ref(true)
const enabledMap = ref<Record<string, boolean>>({})
const saving = ref<Record<string, boolean>>({})

async function loadPrefs() {
    const prefs = await $fetch<FeaturePref[]>('/api/me/feature-prefs')
    const map: Record<string, boolean> = {}
    for (const plugin of pluginRegistry) {
        const saved = prefs.find((p) => p.pluginId === plugin.id)
        map[plugin.id] = saved ? saved.enabled : plugin.defaultEnabled
    }
    enabledMap.value = map
}

async function onToggle(pluginId: string, value: boolean) {
    const prev = enabledMap.value[pluginId] ?? false
    enabledMap.value[pluginId] = value
    saving.value = { ...saving.value, [pluginId]: true }
    try {
        await $fetch('/api/me/feature-prefs', {
            method: 'PUT',
            body: { pluginId, enabled: value }
        })
    } catch {
        enabledMap.value[pluginId] = prev
        toast.add({
            title: '저장 실패',
            description: '잠시 후 다시 시도해주세요.',
            icon: 'i-lucide-circle-alert',
            color: 'error'
        })
    } finally {
        saving.value = { ...saving.value, [pluginId]: false }
    }
}

onMounted(async () => {
    await fetchSession()
    if (isLoggedIn.value) {
        try {
            await loadPrefs()
        } catch {
            toast.add({
                title: '불러오기 실패',
                description: '플러그인 설정을 불러오지 못했습니다.',
                icon: 'i-lucide-circle-alert',
                color: 'error'
            })
        }
    }
    loading.value = false
})
</script>

<template>
    <div class="container mx-auto p-6 max-w-2xl">
        <header class="mb-6 flex items-start justify-between gap-2">
            <div>
                <h1 class="text-2xl font-semibold">플러그인 설정</h1>
                <p class="text-sm text-(--ui-text-muted) mt-1">
                    사용할 플러그인을 켜고 끌 수 있습니다.
                </p>
            </div>
            <UColorModeButton />
        </header>

        <div v-if="loading" class="text-sm text-(--ui-text-muted)">불러오는 중…</div>

        <div
            v-else-if="!isLoggedIn"
            class="rounded-lg border border-dashed border-(--ui-border) p-8 text-center"
        >
            <p class="text-sm text-(--ui-text-muted)">로그인이 필요합니다.</p>
            <UButton to="/" class="mt-3" variant="subtle">지도로 이동</UButton>
        </div>

        <div
            v-else-if="pluginRegistry.length === 0"
            class="rounded-lg border border-dashed border-(--ui-border) p-8 text-center text-sm text-(--ui-text-muted)"
        >
            등록된 플러그인이 없습니다.
        </div>

        <div v-else class="flex flex-col gap-3">
            <UCard v-for="plugin in pluginRegistry" :key="plugin.id">
                <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0">
                        <h2 class="font-medium">{{ plugin.label }}</h2>
                        <p class="text-sm text-(--ui-text-muted)">{{ plugin.description }}</p>
                    </div>
                    <USwitch
                        :model-value="enabledMap[plugin.id] ?? false"
                        :disabled="saving[plugin.id]"
                        @update:model-value="(v: boolean) => onToggle(plugin.id, v)"
                    />
                </div>
            </UCard>
        </div>
    </div>
</template>
