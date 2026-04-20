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
        /** 사이드바를 완전히 숨길지 여부 */
        hideSidebar?: boolean
        /** SecondPanel 표시 여부 */
        showSecondPanel?: boolean
    }>(),
    {
        hideSidebar: false,
        showSecondPanel: false
    }
)

const isSidebarCollapsed = ref(false)

/** SecondPanel이 열릴 때 사이드바를 축소하여 SecondPanel을 강조한다 */
watch(
    () => props.showSecondPanel,
    (open) => {
        if (open) isSidebarCollapsed.value = true
    }
)

/** 사이드바 접힘 상태를 토글한다 */
const toggleSidebar = () => {
    // hideSidebar가 true이면 토글 불가
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
            aria-label="메인 사이드바"
        >
            <slot name="sidebar" :collapsed="isSidebarCollapsed" :toggle-sidebar="toggleSidebar" />
        </aside>

        <aside
            v-if="props.showSecondPanel && $slots.secondPanel"
            class="map-shell__second-panel"
            aria-label="상세 정보 패널"
        >
            <slot name="secondPanel" />
        </aside>

        <div class="map-shell__viewer">
            <section class="map-shell__chatbot-layout">
                <div class="map-shell__chatbot-body map-shell__map-wrapper">
                    <slot />
                </div>

                <div v-if="$slots.footer" class="map-shell__footer">
                    <slot name="footer" />
                </div>
            </section>

            <div v-if="$slots.overlay" class="map-shell__overlay">
                <slot name="overlay" />
            </div>
        </div>
    </div>
</template>

<style scoped src="./MapShell.css"></style>
