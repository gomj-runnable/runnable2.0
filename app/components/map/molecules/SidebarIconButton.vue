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
        class="map-button sidebar-icon-btn"
        :class="{ 'is-active': active }"
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
