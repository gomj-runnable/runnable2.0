<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

type SidebarTabItem = {
    icon: string
    label: string
}

const props = defineProps<{
    /** 탭 목록 (아이콘·레이블 쌍) */
    items: readonly SidebarTabItem[]
    /** 현재 선택된 탭 레이블 */
    modelValue: string
    /** 접힘 상태 — true이면 아이콘만 세로 표시 */
    collapsed?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const tabItems = computed<TabsItem[]>(() =>
    props.items.map((item) => ({
        label: item.label,
        icon: item.icon,
        value: item.label
    }))
)
</script>

<template>
    <!-- 펼침: UTabs pill -->
    <div v-if="!collapsed" class="p-[0.3125rem_0.375rem]">
        <UTabs
            :items="tabItems"
            :model-value="modelValue"
            :content="false"
            :ui="{ trigger: 'px-2 py-1 text-xs gap-1' }"
            @update:model-value="emit('update:modelValue', $event as string)"
        />
    </div>

    <!-- 접힘: 아이콘만 세로 중앙 정렬 -->
    <div v-else class="flex flex-col items-center gap-1 py-2 px-1">
        <button
            v-for="item in props.items"
            :key="item.label"
            class="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--ui-text-muted)] cursor-pointer transition-[color,background-color] duration-150 hover:text-[var(--ui-text-default)]"
            :class="
                item.label === modelValue
                    ? 'text-[var(--ui-primary)] bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)]'
                    : ''
            "
            @click="emit('update:modelValue', item.label)"
        >
            <UIcon :name="item.icon" class="size-5" />
        </button>
    </div>
</template>
