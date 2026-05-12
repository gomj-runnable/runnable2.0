<script setup lang="ts">
import BottomDrawer from '~/shared/ui/BottomDrawer.vue'

defineProps<{ open: boolean }>()
defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
    <BottomDrawer :open="open" @update:open="$emit('update:open', $event)">
        <slot />
    </BottomDrawer>
</template>
