<script setup lang="ts">
import { ref } from '#imports'

defineProps<{
    modelValue: string
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()

const inputRef = ref<{ inputRef: HTMLInputElement | null } | null>(null)

defineExpose({
    focus: () => inputRef.value?.inputRef?.focus()
})
</script>

<template>
    <UInput
        ref="inputRef"
        :model-value="modelValue"
        type="search"
        placeholder="노드 검색..."
        leading-icon="i-lucide-search"
        color="neutral"
        variant="outline"
        size="sm"
        class="ds-search"
        :ui="{
            base: 'ds-search__base',
            leadingIcon: 'ds-search__icon'
        }"
        aria-label="노드 검색"
        autocomplete="off"
        @update:model-value="$emit('update:modelValue', $event as string)"
    />
</template>

<style scoped>
.ds-search {
    width: 100%;
}

:deep(.ds-search__base) {
    font-family: var(--ds-font-mono);
    font-size: 0.75rem;
    background: var(--ds-bg);
    border-color: var(--ds-border);
    color: var(--ds-text);
}

:deep(.ds-search__base:focus) {
    border-color: var(--ds-primary);
    box-shadow: 0 0 0 1px var(--ds-primary);
}

:deep(.ds-search__base::placeholder) {
    color: var(--ds-text-muted);
}

:deep(.ds-search__icon) {
    color: var(--ds-text-muted);
    width: 12px;
    height: 12px;
}
</style>
