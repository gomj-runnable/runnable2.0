<script setup lang="ts">
import MapPanelDrawer from './MapPanelDrawer.vue'

const props = withDefaults(
    defineProps<{
        hideSidebar?: boolean
        showSecondPanel?: boolean
        panelDrawerOpen?: boolean
    }>(),
    {
        hideSidebar: false,
        showSecondPanel: false,
        panelDrawerOpen: false
    }
)

const emit = defineEmits<{
    'update:panelDrawerOpen': [value: boolean]
}>()
</script>

<template>
    <div class="flex flex-col h-screen">
        <!-- Nav Rail: 전체 높이, 좌측 고정 -->
        <slot v-if="!props.hideSidebar" name="sidebar" />

        <!-- 우측 영역: 헤더 + 콘텐츠 -->
        <div class="flex flex-col flex-1 min-w-0">
            <div class="flex flex-1 min-h-0">
                <div
                    class="relative flex flex-col flex-1 overflow-hidden min-w-0 min-h-0 box-border"
                >
                    <section class="relative flex flex-auto w-full min-h-0 overflow-hidden">
                        <div class="relative flex-auto w-full h-full min-h-0 overflow-hidden">
                            <slot />
                        </div>

                        <div
                            v-if="$slots.footer"
                            class="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
                        >
                            <slot name="footer" />
                        </div>
                    </section>

                    <div
                        v-if="$slots.overlay"
                        class="absolute inset-0 pointer-events-none z-10 overflow-hidden [&>*]:pointer-events-auto"
                    >
                        <slot name="overlay" />
                    </div>
                </div>
            </div>
        </div>

        <!-- secondPanel 열기 버튼 (모든 폼팩터) -->
        <div v-if="props.showSecondPanel && $slots.secondPanel" class="fixed bottom-4 right-4 z-30">
            <UButton
                icon="i-lucide-panel-bottom-open"
                size="sm"
                color="neutral"
                variant="solid"
                class="rounded-full shadow-lg"
                aria-label="상세 정보 열기"
                @click="emit('update:panelDrawerOpen', !props.panelDrawerOpen)"
            />
        </div>

        <!-- Bottom Drawer (모든 폼팩터) -->
        <MapPanelDrawer
            v-if="props.showSecondPanel && $slots.secondPanel"
            :open="props.panelDrawerOpen"
            @update:open="emit('update:panelDrawerOpen', $event)"
        >
            <slot name="secondPanel" />
        </MapPanelDrawer>
    </div>
</template>
