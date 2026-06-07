<script setup lang="ts">
// 그래픽 품질(자동/높음/중간/낮음)을 선택하는 설정 모달 컴포넌트.
import { EnumBase } from '#shared/types/enum-base'
import { GraphicQualityEnum } from '#shared/types/graphic-quality.enum'
import type { GraphicQualityKey } from '#shared/types/graphic-quality.enum'
import { useGraphicQualityStore } from '../model/useGraphicQualityStore'

defineProps<{
    /** 모달 표시 여부 */
    open: boolean
}>()

const emit = defineEmits<{
    /** 모달 열림/닫힘 상태 변경 시 새 상태 값을 전달 */
    'update:open': [value: boolean]
}>()

const store = useGraphicQualityStore()

const QUALITY_DESCRIPTIONS: Record<GraphicQualityKey, string> = {
    auto: 'FPS를 측정해 품질을 자동으로 조정합니다',
    high: '화질 우선 — 최대 해상도와 안티앨리어싱',
    medium: '화질과 성능의 균형',
    low: '성능 우선 — 배터리·저사양 기기에 적합'
}

const items = EnumBase.values<GraphicQualityEnum>(GraphicQualityEnum).map((quality) => ({
    label: quality.label,
    value: quality.key,
    description: QUALITY_DESCRIPTIONS[quality.key]
}))

/** 라디오 선택값 ↔ store 레벨을 양방향 연결한다 */
const selected = computed({
    get: () => store.level.value.key,
    set: (key: string) => store.setLevel(GraphicQualityEnum.from(key))
})
</script>

<template>
    <UModal
        :open="open"
        title="그래픽 품질"
        description="지도 렌더링 품질을 설정합니다"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <URadioGroup v-model="selected" :items="items" />
            <p v-if="store.isAuto.value" class="mt-3 text-xs text-(--ui-text-muted)">
                현재 자동 적용 레벨: {{ store.appliedLevel.value.label }}
            </p>
        </template>
    </UModal>
</template>
