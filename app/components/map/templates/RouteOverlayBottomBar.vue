<script setup lang="ts">
import type { RouteClosingMode } from '~/composables/store/useRouteClosingStore'
import type { RouteElevationProfile } from '#shared/types/route'
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import RouteClosingChipBar from '~/components/map/molecules/chips/RouteClosingChipBar.vue'

defineProps<{
    /** 고도 칩 버튼에 표시할 레이블 텍스트 */
    elevationChipLabel: string
    /** 고도 칩 버튼의 활성 상태 여부 */
    elevationChipActive: boolean
    /** 현재 선택된 경로의 고도 프로필 (없으면 null, 칩 미표시) */
    elevationProfile: RouteElevationProfile | null
    /** 현재 경로 닫기 모드 */
    closingMode: RouteClosingMode
    /** 경로 닫기 비활성화 여부 */
    closingDisabled: boolean
}>()

defineEmits<{
    /** 고도 칩 버튼 클릭 시 발생 */
    'toggle-elevation': []
    /** 경로 닫기 모드 변경 시 새 모드를 전달 */
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
