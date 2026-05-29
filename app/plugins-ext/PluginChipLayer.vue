<script setup lang="ts">
/**
 * chip 슬롯 호스트. 8방향 앵커 영역에 chip 플러그인을 manifest.position 기준으로 분배 렌더한다.
 * 위치는 이 레이어가 관리하므로, chip 컴포넌트는 버튼만 그리면 된다.
 */
import type { ChipAnchor } from './types'
import { pluginRegistry } from './registry'
import { usePluginPrefs } from './usePluginPrefs'

const { load, isEnabled } = usePluginPrefs()

const ANCHORS: { id: ChipAnchor; class: string }[] = [
    { id: 'top-left', class: 'top-4 left-4 items-start' },
    { id: 'top-center', class: 'top-4 left-1/2 -translate-x-1/2 items-center' },
    { id: 'top-right', class: 'top-4 right-4 items-end' },
    { id: 'middle-left', class: 'top-1/2 left-4 -translate-y-1/2 items-start' },
    { id: 'middle-right', class: 'top-1/2 right-4 -translate-y-1/2 items-end' },
    { id: 'bottom-left', class: 'bottom-4 left-4 items-start' },
    { id: 'bottom-center', class: 'bottom-4 left-1/2 -translate-x-1/2 items-center' },
    { id: 'bottom-right', class: 'bottom-4 right-4 items-end' }
]

const chipPlugins = computed(() => pluginRegistry.filter((p) => p.slot === 'chip' && isEnabled(p)))

const chipsAt = (anchor: ChipAnchor) =>
    chipPlugins.value.filter((p) => (p.position ?? 'top-center') === anchor)

onMounted(load)
</script>

<template>
    <template v-for="a in ANCHORS" :key="a.id">
        <div
            v-if="chipsAt(a.id).length"
            :class="['absolute z-20 flex flex-col gap-2 w-fit h-fit', a.class]"
        >
            <component :is="p.component" v-for="p in chipsAt(a.id)" :key="p.id" />
        </div>
    </template>
</template>
