<script setup lang="ts">
import type { RouteClosingMode } from '~/composables/store/useRouteClosingStore'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'

defineProps<{
    closingMode: RouteClosingMode
    disabled?: boolean
}>()

defineEmits<{
    'update:closingMode': [mode: RouteClosingMode]
}>()
</script>

<template>
    <div class="route-closing-chip-bar">
        <ChipButton
            label="도착지 연결"
            icon="i-lucide-rotate-ccw"
            appearance="elevated"
            size="md"
            :active="closingMode === 'loop-close'"
            :disabled="disabled"
            @click="$emit('update:closingMode', closingMode === 'loop-close' ? null : 'loop-close')"
        />
        <ChipButton
            label="왕복 코스"
            icon="i-lucide-arrow-left-right"
            appearance="elevated"
            size="md"
            :active="closingMode === 'round-trip'"
            :disabled="disabled"
            @click="$emit('update:closingMode', closingMode === 'round-trip' ? null : 'round-trip')"
        />
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/chips/RouteClosingChipBar.css"></style>
