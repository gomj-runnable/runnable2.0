<script setup lang="ts">
// 경사도 구간별 색상 기준을 지도 좌측 하단에 표시하는 범례 컴포넌트.
defineProps<{
    /** 다른 범례(날씨/고도)가 표시 중인지 여부 */
    hasOtherLegend?: boolean
}>()
</script>

<template>
    <div
        class="absolute bottom-4 left-4 bg-surface-darker border border-border-accent rounded-2xl px-2.5 py-1.5 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.16)] min-w-[140px] pointer-events-auto z-0 max-md:bottom-1.5 max-md:left-1.5 max-md:min-w-0 max-md:px-1.5 max-md:py-1"
        :class="
            hasOtherLegend ? 'bottom-[calc(1rem+48px)] max-md:bottom-[calc(0.375rem+40px)]' : ''
        "
    >
        <p class="text-xs text-meta mb-1.5 font-semibold tracking-[0.04em] uppercase">경사도</p>
        <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                    class="w-3 h-3 rounded-lg border border-(--ui-border) shrink-0"
                    style="background: #4caf50"
                />
                완만 (0~3%)
            </div>
            <div class="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                    class="w-3 h-3 rounded-lg border border-(--ui-border) shrink-0"
                    style="background: #ffc107"
                />
                약간 가파름 (3~7%)
            </div>
            <div class="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                    class="w-3 h-3 rounded-lg border border-(--ui-border) shrink-0"
                    style="background: #ff9800"
                />
                가파름 (7~12%)
            </div>
            <div class="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                    class="w-3 h-3 rounded-lg border border-(--ui-border) shrink-0"
                    style="background: #f44336"
                />
                매우 가파름 (12%+)
            </div>
        </div>
    </div>
</template>
