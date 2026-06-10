<script setup lang="ts">
/**
 * 표면 슬롯(sidepanel/dashboard/popup) 플러그인을 여는 런처.
 * enabled 인 표면 플러그인을 버튼으로 노출한다. 위치는 상위 앵커(MapOverlayAnchors)가 관리한다.
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
</template>
