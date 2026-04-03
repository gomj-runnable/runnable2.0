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

        <div v-if="!collapsed" class="map-sidebar__body">
            <slot />
        </div>

        <footer v-if="!collapsed" class="map-sidebar__footer">
            <slot name="footer" />
        </footer>
    </div>
</template>

<style scoped>
.map-sidebar {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--sidebar-border);
    flex-shrink: 0;
}

.map-sidebar--collapsed {
    align-items: stretch;
}

.map-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 10px 10px;
    gap: 6px;
    flex-shrink: 0;
    min-height: 56px;
}

.map-sidebar__body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.map-sidebar__body::-webkit-scrollbar {
    width: 3px;
}

.map-sidebar__body::-webkit-scrollbar-thumb {
    background: var(--sidebar-border);
    border-radius: 2px;
}

.map-sidebar__subheader {
    flex-shrink: 0;
    border-bottom: 1px solid var(--sidebar-border);
}

.map-sidebar__footer {
    padding: 8px;
    border-top: 1px solid var(--sidebar-border);
    flex-shrink: 0;
}
</style>
