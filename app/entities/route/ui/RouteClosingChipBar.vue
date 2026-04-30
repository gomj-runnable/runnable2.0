<script setup lang="ts">
import type { RouteClosingMode } from '~/entities/route/model/useRouteClosingStore'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

defineProps<{
    /** 현재 활성화된 경로 닫기 모드 (RouteClosingModeEnum | null) */
    closingMode: RouteClosingMode
    /** 칩 버튼 전체 비활성화 여부 */
    disabled?: boolean
}>()

/** 경로 닫기 모드 변경 이벤트 (같은 모드 재클릭 시 null로 해제) */
defineEmits<{
    'update:closingMode': [mode: RouteClosingMode]
}>()
</script>

<template>
    <div class="flex gap-1 items-center">
        <UButton
            label="도착지 연결"
            icon="i-lucide-rotate-ccw"
            size="md"
            :variant="closingMode?.isLoopClose ? 'solid' : 'outline'"
            :color="closingMode?.isLoopClose ? 'primary' : 'neutral'"
            :disabled="disabled"
            @click="
                $emit(
                    'update:closingMode',
                    closingMode?.isLoopClose ? null : RouteClosingModeEnum.LOOP_CLOSE
                )
            "
        />
        <UButton
            label="왕복 코스"
            icon="i-lucide-arrow-left-right"
            size="md"
            :variant="closingMode?.isRoundTrip ? 'solid' : 'outline'"
            :color="closingMode?.isRoundTrip ? 'primary' : 'neutral'"
            :disabled="disabled"
            @click="
                $emit(
                    'update:closingMode',
                    closingMode?.isRoundTrip ? null : RouteClosingModeEnum.ROUND_TRIP
                )
            "
        />
    </div>
</template>
