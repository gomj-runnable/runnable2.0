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
        class="w-full font-mono text-xs"
        aria-label="노드 검색"
        autocomplete="off"
        @update:model-value="$emit('update:modelValue', $event as string)"
    />
</template>
