<script setup lang="ts">
/**
 * 표면 슬롯(sidepanel/dashboard/popup) 플러그인을 여는 런처.
 * enabled 인 표면 플러그인을 버튼 스택으로 노출한다.
 */
import { pluginRegistry } from './registry'
import { usePluginPrefs } from './usePluginPrefs'
import { usePluginSurfaces } from './usePluginSurfaces'

const { load, isEnabled } = usePluginPrefs()
const { open } = usePluginSurfaces()

const surfacePlugins = computed(() =>
    pluginRegistry.filter((p) => p.slot !== 'chip' && isEnabled(p))
)

onMounted(load)
</script>

<template>
    <div
        v-if="surfacePlugins.length"
        class="absolute bottom-4 right-4 z-20 flex flex-col gap-2 items-end"
    >
        <UButton
            v-for="p in surfacePlugins"
            :key="p.id"
            :label="p.label"
            icon="i-lucide-layout-grid"
            size="sm"
            color="neutral"
            variant="solid"
            class="rounded-full shadow"
            @click="open(p.id)"
        />
    </div>
</template>
