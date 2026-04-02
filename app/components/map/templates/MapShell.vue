<script setup lang="ts">
/**
 * MapShell — 사이드바 + 뷰어 전체 Shell
 *
 * Flat 사용:
 *   <MapShell> <div id="map" /> </MapShell>
 *
 * Compound 사용:
 *   <MapShell>
 *     <template #sidebar><MapSidebar>...</MapSidebar></template>
 *     <template #default><div id="map" /></template>
 *     <template #overlay><MapToolbar /></template>
 *   </MapShell>
 */
defineProps<{
    hideSidebar?: boolean
}>()
</script>

<template>
    <div class="map-shell">
        <aside v-if="!hideSidebar" class="map-shell__sidebar">
            <slot name="sidebar" />
        </aside>

        <div class="map-shell__viewer">
            <slot />

            <div v-if="$slots.overlay" class="map-shell__overlay">
                <slot name="overlay" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.map-shell {
    display: flex;
    width: 100%;
    height: 100%;
}

.map-shell__sidebar {
    position: relative;
    z-index: var(--z-panel);
    flex-shrink: 0;
}

.map-shell__viewer {
    position: relative;
    flex: 1;
    overflow: hidden;
}

.map-shell__overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: var(--z-panel);
}

.map-shell__overlay > * {
    pointer-events: auto;
}
</style>
