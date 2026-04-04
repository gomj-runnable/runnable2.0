<script setup lang="ts">
defineProps<{
    icon?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
    <button type="button" class="sidebar-action-btn" @click="$emit('click')">
        <UIcon v-if="icon" :name="icon" class="sidebar-action-btn__icon" />
        <slot />
    </button>
</template>

<style scoped src="~/assets/css/components/map/molecules/SidebarActionButton.css"></style>
