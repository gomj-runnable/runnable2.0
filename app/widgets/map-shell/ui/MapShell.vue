<script setup lang="ts">
/**
 * MapShell — 사이드바 + 뷰어 전체 Shell
 *
 * USidebar의 v-model:open을 통해 접힘 상태를 관리한다.
 * SecondPanel이 열릴 때 사이드바를 자동으로 축소한다.
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

const isSidebarOpen = ref(true)

/** SecondPanel이 열릴 때 사이드바를 축소하여 SecondPanel을 강조한다 */
watch(
    () => props.showSecondPanel,
    (open) => {
        if (open) isSidebarOpen.value = false
    }
)

/** 사이드바 접힘 상태를 토글한다 */
const toggleSidebar = () => {
    if (props.hideSidebar) return
    isSidebarOpen.value = !isSidebarOpen.value
}

/** 사이드바 열림 상태를 직접 설정한다 */
const setSidebarOpen = (value: boolean) => {
    if (props.hideSidebar) return
    isSidebarOpen.value = value
}
</script>

<template>
    <div class="map-shell">
        <slot
            v-if="!props.hideSidebar"
            name="sidebar"
            :open="isSidebarOpen"
            :toggle-sidebar="toggleSidebar"
            :set-sidebar-open="setSidebarOpen"
        />

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
