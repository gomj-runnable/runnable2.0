<script setup lang="ts">
/**
 * 지정된 확장 슬롯에 활성 플러그인 컴포넌트를 렌더하는 제네릭 호스트.
 * 활성 여부는 user prefs(usePluginPrefs)로 판정한다. 위치/스타일은 각 플러그인이 자체 관리.
 */
import type { PluginSlot } from './types'
import { pluginRegistry } from './registry'
import { usePluginPrefs } from './usePluginPrefs'

const props = defineProps<{ slotName: PluginSlot }>()

const { load, isEnabled } = usePluginPrefs()

const plugins = computed(() =>
    pluginRegistry.filter((p) => p.slot === props.slotName && isEnabled(p))
)

onMounted(load)
</script>

<template>
    <component :is="p.component" v-for="p in plugins" :key="p.id" />
</template>
