<script setup lang="ts">
import IconButton from '~/components/map/molecules/buttons/IconButton.vue'

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
        logoIcon: undefined,
        logoLabel: undefined,
        collapsed: false
    }
)
</script>

<template>
    <div class="map-sidebar" :class="{ 'is-collapsed': collapsed }">
        <header class="map-sidebar__header">
            <slot name="header">
                <IconButton :icon="logoIcon" :label="logoLabel" />
            </slot>
        </header>

        <div v-if="$slots.subheader" class="map-sidebar__subheader">
            <slot name="subheader" />
        </div>

        <div class="map-sidebar__content" :class="{ 'is-collapsed': collapsed }">
            <div class="map-sidebar__body">
                <slot />
            </div>
        </div>

        <footer class="map-sidebar__footer" :class="{ 'is-collapsed': collapsed }">
            <slot name="footer" />
        </footer>
    </div>
</template>

<style scoped src="~/assets/css/components/map/templates/MapSidebar.css"></style>
