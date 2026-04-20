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
    <div class="hover-tooltip" @mouseenter="isVisible = true" @mouseleave="isVisible = false">
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

<style scoped src="./HoverTooltip.css"></style>
