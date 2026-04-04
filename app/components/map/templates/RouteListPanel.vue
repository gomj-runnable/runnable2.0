<script setup lang="ts">
/**
 * RouteListPanel — 검색 + 경로 목록 패널 레이아웃
 *
 * Flat 사용:
 *   <RouteListPanel title="내 경로" />
 *
 * Compound 사용:
 *   <RouteListPanel>
 *     <template #search><RouteSearchInput v-model="q" /></template>
 *     <template #actions><UButton icon="i-lucide-plus" /></template>
 *     <RouteListItem v-for="r in routes" :key="r.id" v-bind="r" />
 *     <template #empty>경로가 없습니다</template>
 *   </RouteListPanel>
 *
 * Slots:
 *   search   — 검색 입력 영역
 *   actions  — 제목 우측 액션 버튼
 *   default  — 목록 아이템
 *   empty    — 목록이 비었을 때 fallback
 */
defineProps<{
    title?: string
    empty?: boolean
}>()
</script>

<template>
    <div class="route-list-panel">
        <!-- 헤더 -->
        <div class="route-list-panel__header">
            <span v-if="title" class="route-list-panel__title">{{ title }}</span>
            <div v-if="$slots.actions" class="route-list-panel__actions">
                <slot name="actions" />
            </div>
        </div>

        <!-- 검색 -->
        <div v-if="$slots.search" class="route-list-panel__search">
            <slot name="search" />
        </div>

        <!-- 목록 -->
        <div class="route-list-panel__list">
            <slot v-if="!empty" />
            <div v-else class="route-list-panel__empty">
                <slot name="empty">
                    <UIcon name="i-lucide-map-off" class="route-list-panel__empty-icon" />
                    <span>경로가 없습니다</span>
                </slot>
            </div>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/map/templates/RouteListPanel.css"></style>
