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
const props = withDefaults(
    defineProps<{
        hideSidebar?: boolean
    }>(),
    {
        hideSidebar: false
    }
)

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
    if (props.hideSidebar) return

    isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<template>
    <div class="map-shell">
        <aside
            v-if="!props.hideSidebar"
            class="map-shell__sidebar"
            :class="{ 'is-collapsed': isSidebarCollapsed }"
        >
            <slot name="sidebar" :collapsed="isSidebarCollapsed" :toggle-sidebar="toggleSidebar" />
        </aside>

        <div class="map-shell__viewer">
            <section class="map-shell__chatbot-layout">
                <div class="map-shell__chatbot-body map-shell__map-wrapper">
                    <slot />
                </div>
            </section>

            <div v-if="$slots.overlay" class="map-shell__overlay">
                <slot name="overlay" />
            </div>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/templates/MapShell.css"></style>
