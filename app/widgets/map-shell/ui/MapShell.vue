<script setup lang="ts">
/**
 * MapShell — 사이드바 + 뷰어 전체 Shell
 *
 * USidebar의 v-model:open을 통해 접힘 상태를 관리한다.
 * SecondPanel이 열릴 때 사이드바를 자동으로 축소한다.
 * 모바일(≤768px)에서는 사이드바가 오버레이로 전환되고 햄버거 헤더가 표시된다.
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
const isMobileSidebarOpen = ref(false)

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

/** 모바일 사이드바 토글 */
const toggleMobileSidebar = () => {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}
</script>

<template>
    <div class="map-shell" :class="{ 'is-mobile-sidebar-open': isMobileSidebarOpen }">
        <!-- 모바일 헤더 (≤768px에서만 표시) -->
        <header v-if="!props.hideSidebar" class="map-shell__mobile-header">
            <UButton
                icon="i-lucide-menu"
                variant="ghost"
                color="neutral"
                size="md"
                aria-label="사이드바 열기"
                @click="toggleMobileSidebar"
            />
            <UButton
                variant="ghost"
                icon="i-lucide-map-pin"
                label="Runnable"
                color="neutral"
                size="md"
                class="map-shell__mobile-title"
            />
        </header>

        <!-- 사이드바 래퍼 (데스크톱: inline, 모바일: 오버레이) -->
        <div v-if="!props.hideSidebar" class="map-shell__sidebar-wrapper">
            <slot
                name="sidebar"
                :open="isSidebarOpen"
                :toggle-sidebar="toggleSidebar"
                :set-sidebar-open="setSidebarOpen"
            />
        </div>

        <!-- 모바일 사이드바 배경 -->
        <Transition name="mobile-backdrop">
            <div
                v-if="isMobileSidebarOpen"
                class="map-shell__mobile-backdrop"
                @click="isMobileSidebarOpen = false"
            />
        </Transition>

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
