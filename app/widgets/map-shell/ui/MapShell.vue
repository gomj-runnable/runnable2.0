<script setup lang="ts">
/**
 * MapShell — Nav Rail + UHeader + 뷰어 Shell
 *
 * Nav Rail(sidebar slot)이 전체 높이를 차지하고,
 * 우측에 UHeader와 뷰어가 배치된다.
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
</script>

<template>
    <div class="flex flex-col h-screen">
        <!-- Nav Rail: 전체 높이, 좌측 고정 -->
        <slot v-if="!props.hideSidebar" name="sidebar" />

        <!-- 우측 영역: 헤더 + 콘텐츠 -->
        <div class="flex flex-col flex-1 min-w-0">
            <div class="flex flex-1 min-h-0">
                <aside
                    v-if="props.showSecondPanel && $slots.secondPanel"
                    class="relative flex self-stretch z-10 w-[280px] h-full min-h-0 shrink-0 overflow-y-auto bg-surface-dark border-r border-border-accent will-change-[width] transition-[width] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] max-lg:hidden"
                    aria-label="상세 정보 패널"
                >
                    <slot name="secondPanel" />
                </aside>

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
    </div>
</template>
