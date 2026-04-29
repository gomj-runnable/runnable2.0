<script setup lang="ts">
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

const handleSelect = (label: string) => {
    emit('update:modelValue', label)
}
</script>

<template>
    <div class="map-sidebar-tabs" :class="{ 'map-sidebar-tabs--collapsed': collapsed }">
        <UButton
            v-for="item in props.items"
            :key="item.label"
            :icon="item.icon"
            :label="collapsed ? undefined : item.label"
            :variant="props.modelValue === item.label ? 'subtle' : 'ghost'"
            :color="props.modelValue === item.label ? 'primary' : 'neutral'"
            :block="!collapsed"
            :square="collapsed"
            @click="handleSelect(item.label)"
        />
    </div>
</template>

<style scoped>
.map-sidebar-tabs {
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    padding: 0.625rem 0.75rem;
}

.map-sidebar-tabs--collapsed {
    flex-direction: column;
    align-items: center;
    padding: 0.625rem 0.25rem;
}
</style>
