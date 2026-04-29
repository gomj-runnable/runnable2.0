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
    <div v-if="!collapsed" class="map-sidebar-tabs">
        <UTabs
            :items="tabItems"
            :model-value="modelValue"
            :content="false"
            :ui="{ trigger: 'px-2 py-1 text-xs gap-1' }"
            @update:model-value="emit('update:modelValue', $event as string)"
        />
    </div>

    <!-- 접힘: 아이콘만 세로 중앙 정렬 -->
    <div v-else class="map-sidebar-tabs--collapsed">
        <button
            v-for="item in props.items"
            :key="item.label"
            class="collapsed-tab"
            :class="{ 'collapsed-tab--active': modelValue === item.label }"
            @click="emit('update:modelValue', item.label)"
        >
            <UIcon :name="item.icon" class="size-5" />
        </button>
    </div>
</template>

<style scoped>
.map-sidebar-tabs {
    padding: 0.3125rem 0.375rem;
}

.map-sidebar-tabs--collapsed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.25rem;
}

.collapsed-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    color: var(--ui-text-muted);
    cursor: pointer;
    transition: color 0.15s, background-color 0.15s;
}

.collapsed-tab:hover {
    color: var(--ui-text-default);
}

.collapsed-tab--active {
    color: var(--ui-primary);
    background-color: color-mix(in srgb, var(--ui-primary) 15%, transparent);
}
</style>
