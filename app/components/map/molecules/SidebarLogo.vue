<script setup lang="ts">
defineProps<{
    icon?: string
    label?: string
}>()
</script>

<template>
    <div class="sidebar-logo">
        <slot name="icon">
            <UIcon v-if="icon" :name="icon" class="sidebar-logo__icon" />
        </slot>
        <slot>
            <span v-if="label" class="sidebar-logo__label">{{ label }}</span>
        </slot>
    </div>
</template>

<style scoped src="~/assets/css/components/map/molecules/SidebarLogo.css"></style>
