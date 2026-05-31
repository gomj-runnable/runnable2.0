<script setup lang="ts">
// 사이드바·오버레이·푸터 슬롯을 조합하는 지도 페이지 레이아웃 shell 컴포넌트.
const props = withDefaults(
    defineProps<{
        hideSidebar?: boolean
    }>(),
    {
        hideSidebar: false
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
