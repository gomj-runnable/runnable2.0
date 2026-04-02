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
            <section class="map-shell__chatbot-layout">
                <div id="map-wrapper" class="map-shell__chatbot-body">
                    <slot />
                </div>
            </section>

            <div v-if="$slots.overlay" class="map-shell__overlay">
                <slot name="overlay" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.map-shell {
    display: flex;
    width: 100vw;
    height: 100vh;
    min-width: 100vw;
    min-height: 100vh;
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
    min-width: 0;
    min-height: 100vh;
}

.map-shell__chatbot-layout {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100vh;
}

.map-shell__chatbot-body {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow: hidden;
}

#map-wrapper {
    position: relative;
    width: 100vw;
    height: 100dvh;
}

#map {
    position: absolute;
    inset: 0;
    height: 100vh;
    width: 100vw;
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
