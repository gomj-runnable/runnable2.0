<script setup lang="ts">
import type { RouteClosingMode } from '~/composables/store/useRouteClosingStore'
import type { RouteElevationProfile } from '#shared/types/route'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import RouteClosingChipBar from '~/components/map/molecules/chips/RouteClosingChipBar.vue'

defineProps<{
    elevationChipLabel: string
    elevationChipActive: boolean
    elevationProfile: RouteElevationProfile | null
    closingMode: RouteClosingMode
    closingDisabled: boolean
}>()

defineEmits<{
    'toggle-elevation': []
    'update:closingMode': [mode: RouteClosingMode]
}>()
</script>

<template>
    <div class="route-overlay-chip-bar">
        <ChipButton
            v-if="elevationProfile"
            :label="elevationChipLabel"
            icon="i-lucide-chart-line"
            appearance="elevated"
            size="md"
            :active="elevationChipActive"
            @click="$emit('toggle-elevation')"
        />
        <RouteClosingChipBar
            :closing-mode="closingMode"
            :disabled="closingDisabled"
            @update:closing-mode="$emit('update:closingMode', $event)"
        />
    </div>
</template>

<style scoped src="~/assets/css/components/templates/RouteOverlayBottomBar.css"></style>
