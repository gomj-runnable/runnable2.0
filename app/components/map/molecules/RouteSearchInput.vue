<script setup lang="ts">
/**
 * RouteSearchInput — 경로 검색 입력 필드
 *
 * Flat 사용:
 *   <RouteSearchInput v-model="query" />
 *
 * Props:
 *   placeholder — 입력 힌트 텍스트
 */
defineProps<{
    placeholder?: string
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
    <UInput
        v-model="model"
        :placeholder="placeholder ?? '경로 검색...'"
        leading-icon="i-lucide-search"
        color="neutral"
        variant="soft"
        size="sm"
        :ui="{ base: 'route-search-input' }"
    />
</template>

<style scoped>
:deep(.route-search-input) {
    background: var(--sidebar-item-hover);
    border-color: var(--sidebar-border);
    color: var(--sidebar-icon-hover);
    width: 100%;
}
</style>
