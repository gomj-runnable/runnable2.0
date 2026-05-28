<script setup lang="ts">
/**
 * 지정된 확장 슬롯에 등록된(활성) 플러그인 컴포넌트를 렌더하는 제네릭 호스트.
 * 위치/스타일은 각 플러그인 컴포넌트가 자체 관리한다.
 */
import type { PluginSlot } from './types'
import { getEnabledPlugins } from './registry'

const props = defineProps<{ slotName: PluginSlot }>()

const plugins = computed(() => getEnabledPlugins(props.slotName))
</script>

<template>
    <component :is="p.component" v-for="p in plugins" :key="p.id" />
</template>
