<script setup lang="ts">
defineProps<{
    label: string
    active?: boolean
    icon?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        type="button"
        class="sidebar-route-item"
        :class="{ 'sidebar-route-item--active': active }"
        @click="$emit('click')"
    >
        <UIcon v-if="icon" :name="icon" class="sidebar-route-item__icon" />
        <span class="sidebar-route-item__label">{{ label }}</span>
        <!-- trailing: 배지, 화살표 등 추가 요소 -->
        <slot name="trailing" />
    </button>
</template>

<style scoped src="~/assets/css/components/map/molecules/SidebarRouteItem.css"></style>
