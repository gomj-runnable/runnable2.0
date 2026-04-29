<script setup lang="ts">
/**
 * MapShell — UHeader + USidebar + 뷰어 Shell
 *
 * Nuxt UI의 UHeader(#toggle)와 USidebar가 동일한 open 상태를 공유하여
 * 데스크톱/모바일 사이드바를 네이티브로 처리한다.
 */
const props = withDefaults(
    defineProps<{
        hideSidebar?: boolean
        showSecondPanel?: boolean
    }>(),
    {
        hideSidebar: false,
        showSecondPanel: false
    }
)

const isSidebarOpen = ref(true)

watch(
    () => props.showSecondPanel,
    (open) => {
        if (open) isSidebarOpen.value = false
    }
)

const setSidebarOpen = (value: boolean) => {
    if (props.hideSidebar) return
    isSidebarOpen.value = value
}
</script>

<template>
    <div class="flex flex-col flex-1 h-screen">
        <UHeader v-if="!props.hideSidebar" toggle-side="left" :ui="{ container: 'px-4! max-w-none!', center: 'hidden', right: 'hidden', left: 'flex-1' }">
            <template #toggle>
                <UButton
                    icon="i-lucide-panel-left"
                    color="neutral"
                    variant="ghost"
                    aria-label="사이드바 토글"
                    @click="isSidebarOpen = !isSidebarOpen"
                />
            </template>

            <template #left>
                <UIcon name="i-lucide-map-pin" class="size-5" />
                <span class="font-semibold text-sm">Runnable</span>
            </template>
        </UHeader>

        <div class="flex flex-1 min-h-0">
            <slot
                v-if="!props.hideSidebar"
                name="sidebar"
                :open="isSidebarOpen"
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
    </div>
</template>

<style scoped src="./MapShell.css"></style>
