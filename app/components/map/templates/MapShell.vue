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
const props = withDefaults(defineProps<{
    hideSidebar?: boolean
}>(), {
    hideSidebar: false
})

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
    if (props.hideSidebar)
        return

    isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<template>
    <div class="map-shell">
        <aside
            v-if="!props.hideSidebar"
            class="map-shell__sidebar"
            :class="{ 'map-shell__sidebar--collapsed': isSidebarCollapsed }"
        >
            <slot
                name="sidebar"
                :collapsed="isSidebarCollapsed"
                :toggleSidebar="toggleSidebar"
            />
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
    width: 240px;
    flex-shrink: 0;
    transition: width var(--transition);
}

.map-shell__sidebar--collapsed {
    width: 64px;
}

.map-shell__viewer {
    position: relative;
    flex: 1;
    overflow: hidden;
    min-width: 0;
    min-height: 100vh;
    padding: 16px 16px 16px 0;
    box-sizing: border-box;
}

.map-shell__viewer::before {
    content: '';
    position: absolute;
    inset: 16px 16px 16px 0;
    z-index: var(--z-panel);
    border: 4px solid rgba(255, 255, 255, 0.14);
    border-radius: 24px;
    box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.04),
        0 12px 40px rgba(0, 0, 0, 0.18);
    pointer-events: none;
}

.map-shell__chatbot-layout {
    position: relative;
    width: 100%;
    height: calc(100vh - 32px);
    border-radius: 24px;
    overflow: hidden;
}

.map-shell__chatbot-body {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

#map-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

#map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
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
