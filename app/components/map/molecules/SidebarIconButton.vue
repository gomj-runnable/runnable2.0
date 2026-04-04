<script setup lang="ts">
defineProps<{
    icon: string
    label: string
    active?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button
        type="button"
        class="sidebar-icon-btn"
        :class="{ 'sidebar-icon-btn--active': active }"
        :aria-label="label"
        :title="label"
        @click="$emit('click')"
    >
        <slot>
            <UIcon :name="icon" class="sidebar-icon-btn__icon" />
        </slot>
    </button>
</template>

<style scoped src="~/assets/css/components/map/molecules/SidebarIconButton.css"></style>
