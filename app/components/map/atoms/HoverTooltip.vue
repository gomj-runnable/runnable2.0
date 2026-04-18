<script setup lang="ts">
/**
 * 호버 시 tooltip을 표시하는 범용 래퍼 컴포넌트.
 * trigger 슬롯에 호버 대상을, content 슬롯에 tooltip 내용을 배치한다.
 *
 * @example
 * <HoverTooltip placement="top">
 *   <template #trigger>
 *     <span class="badge">초급</span>
 *   </template>
 *   <template #content>
 *     <p>난이도 기준 설명...</p>
 *   </template>
 * </HoverTooltip>
 */
withDefaults(
    defineProps<{
        /** tooltip 위치. trigger 기준 방향. */
        placement?: 'top' | 'bottom' | 'left' | 'right'
        /** tooltip과 trigger 사이 간격 (px) */
        offset?: number
    }>(),
    { placement: 'top', offset: 8 }
)

const isVisible = ref(false)
</script>

<template>
    <div
        class="hover-tooltip"
        @mouseenter="isVisible = true"
        @mouseleave="isVisible = false"
    >
        <slot name="trigger" />
        <div
            v-if="isVisible"
            class="hover-tooltip__content"
            :class="`hover-tooltip__content--${placement}`"
            :style="{
                '--tooltip-offset': `${offset}px`
            }"
        >
            <slot name="content" />
        </div>
    </div>
</template>

<style scoped>
.hover-tooltip {
    position: relative;
    display: inline-flex;
}

.hover-tooltip__content {
    position: absolute;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-surface-md);
    padding: var(--gap-section-xs) var(--gap-section-sm);
    backdrop-filter: var(--blur);
    box-shadow: var(--shadow-md);
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
}

.hover-tooltip__content--top {
    bottom: calc(100% + var(--tooltip-offset));
    left: 50%;
    transform: translateX(-50%);
}

.hover-tooltip__content--bottom {
    top: calc(100% + var(--tooltip-offset));
    left: 50%;
    transform: translateX(-50%);
}

.hover-tooltip__content--left {
    right: calc(100% + var(--tooltip-offset));
    top: 50%;
    transform: translateY(-50%);
}

.hover-tooltip__content--right {
    left: calc(100% + var(--tooltip-offset));
    top: 50%;
    transform: translateY(-50%);
}
</style>
