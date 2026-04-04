<script setup lang="ts">
/**
 * MapSidebar — Compound 패턴
 *
 * Flat 사용 (간단한 경우):
 *   <MapSidebar logo-icon="i-lucide-map" logo-label="Runnable" />
 *
 * Compound 사용 (커스텀이 필요한 경우):
 *   <MapSidebar>
 *     <template #header>...</template>
 *     <template #default>...</template>
 *     <template #footer>...</template>
 *   </MapSidebar>
 */
withDefaults(
    defineProps<{
        logoIcon?: string
        logoLabel?: string
        collapsed?: boolean
    }>(),
    {
        collapsed: false
    }
)
</script>

<template>
    <div class="map-sidebar" :class="{ 'map-sidebar--collapsed': collapsed }">
        <header class="map-sidebar__header">
            <slot name="header">
                <SidebarLogo :icon="logoIcon" :label="logoLabel" />
            </slot>
        </header>

        <div v-if="$slots.subheader" class="map-sidebar__subheader">
            <slot name="subheader" />
        </div>

        <div class="map-sidebar__content" :class="{ 'map-sidebar__content--collapsed': collapsed }">
            <div class="map-sidebar__body">
                <slot />
            </div>
        </div>

        <footer class="map-sidebar__footer" :class="{ 'map-sidebar__footer--collapsed': collapsed }">
            <slot name="footer" />
        </footer>
    </div>
</template>

<style scoped src="~/assets/css/components/map/templates/MapSidebar.css"></style>
