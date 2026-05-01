<script setup lang="ts">
import type { RouteClosingMode } from '~/entities/route/model/useRouteClosingStore'
import type { RouteElevationProfile } from '#shared/types/route'
import type { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'
import RouteClosingChipBar from '~/entities/route/ui/RouteClosingChipBar.vue'
import GradientToggle from '~/entities/gradient/ui/GradientToggle.vue'

withDefaults(
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
        /** 경로 닫기 칩 바 표시 여부 (그리기 탭에서만 true) */
        showClosing?: boolean
        /** 경사도 레이어 활성 여부 */
        gradientActive?: boolean
        /** 현재 경로 난이도 */
        gradientDifficulty?: DifficultyLevelEnum | null
    }>(),
    { showClosing: true, gradientActive: false, gradientDifficulty: null }
)

defineEmits<{
    /** 고도 칩 버튼 클릭 시 발생 */
    'toggle-elevation': []
    /** 경로 닫기 모드 변경 시 새 모드를 전달 */
    'update:closingMode': [mode: RouteClosingMode]
    /** 경사도 토글 클릭 시 발생 */
    'toggle-gradient': []
}>()
</script>

<template>
    <div
        class="absolute left-1/2 bottom-4 -translate-x-1/2 z-[4] flex items-center gap-1.5 pointer-events-auto max-md:hidden"
    >
        <UButton
            v-if="elevationProfile"
            :label="elevationChipLabel"
            icon="i-lucide-chart-line"
            size="md"
            :variant="elevationChipActive ? 'solid' : 'outline'"
            :color="elevationChipActive ? 'primary' : 'neutral'"
            @click="$emit('toggle-elevation')"
        />
        <RouteClosingChipBar
            v-if="showClosing"
            :closing-mode="closingMode"
            :disabled="closingDisabled"
            @update:closing-mode="$emit('update:closingMode', $event)"
        />
        <GradientToggle
            :active="gradientActive"
            :difficulty="gradientDifficulty ?? null"
            @toggle="$emit('toggle-gradient')"
        />
    </div>
</template>
