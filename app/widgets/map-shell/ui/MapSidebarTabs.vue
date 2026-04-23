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
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const handleSelect = (label: string) => {
    emit('update:modelValue', label)
}
</script>

<template>
    <div class="map-sidebar-tabs">
        <UButton
            v-for="item in props.items"
            :key="item.label"
            :icon="item.icon"
            :label="item.label"
            :variant="props.modelValue === item.label ? 'subtle' : 'ghost'"
            :color="props.modelValue === item.label ? 'primary' : 'neutral'"
            block
            @click="handleSelect(item.label)"
        />
    </div>
</template>

<style scoped src="./MapSidebarTabs.css"></style>
