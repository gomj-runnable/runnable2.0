<script setup lang="ts">
import { formatDistance } from '~/shared/lib/useFormatUtils'

defineProps<{
    /** 팝업 표시 여부 */
    open: boolean
    /** 경로 제목 입력값 */
    title: string
    /** 경로 설명 입력값 */
    description: string
    /** 경로 총 거리 (km 단위, 없으면 미표시) */
    distance?: number
    /** 경로가 통과하는 행정구역 (자동 감지) */
    districts?: string[]
    /** 수정 모드 여부 */
    isEditing?: boolean
}>()

defineEmits<{
    /** 팝업 열림/닫힘 상태 변경 시 새 상태 값을 전달 */
    'update:open': [value: boolean]
    /** 제목 입력 변경 시 새 값을 전달 */
    'update:title': [value: string]
    /** 설명 입력 변경 시 새 값을 전달 */
    'update:description': [value: string]
    /** 저장 버튼 클릭 시 발생 */
    submit: []
}>()
</script>

<template>
    <UModal
        :open="open"
        :title="isEditing ? '경로 수정' : '경로 저장'"
        :description="isEditing ? '경로 정보를 수정하세요' : '경로 정보를 입력하세요'"
        :ui="{ footer: 'justify-end' }"
        @update:open="$emit('update:open', $event)"
    >
        <template #body>
            <div class="fields-root flex flex-col gap-3">
                <label class="map-form-field">
                    <span class="map-form-label">제목</span>
                    <UInput
                        :model-value="title"
                        placeholder="경로 제목"
                        @update:model-value="$emit('update:title', $event)"
                    />
                </label>

                <label class="map-form-field">
                    <span class="map-form-label">설명</span>
                    <textarea
                        :value="description"
                        rows="4"
                        class="map-form-control"
                        placeholder="경로 설명"
                        @input="
                            $emit(
                                'update:description',
                                ($event.target as HTMLTextAreaElement).value
                            )
                        "
                    />
                </label>

                <label class="map-form-field">
                    <span class="map-form-label">거리</span>
                    <UInput :model-value="formatDistance(distance)" placeholder="0.00" disabled />
                </label>

                <div v-if="districts?.length" class="map-form-field">
                    <span class="map-form-label">행정구역</span>
                    <div class="text-sm text-(--ui-text-muted) leading-[1.5]">
                        {{ districts.join(', ') }}
                    </div>
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <UButton variant="outline" color="neutral" label="취소" @click="close" />
            <UButton
                variant="solid"
                color="primary"
                :label="isEditing ? '수정' : '저장'"
                @click="$emit('submit')"
            />
        </template>
    </UModal>
</template>

<style scoped>
.fields-root {
    --map-form-label-color: var(--ui-text-muted);
    --map-form-bg: var(--ui-bg-elevated);
    --map-form-color: var(--ui-text-highlighted);
    --map-form-font-size: 0.875rem;
    --map-form-line-height: 1.5;
    --map-form-padding: 0.75rem;
    --map-form-resize: vertical;
    --map-form-placeholder: var(--ui-text-dimmed);
    --map-form-focus-border: var(--ui-border-accented);
    --map-form-focus-bg: var(--ui-bg-elevated);
    --map-form-disabled-color: var(--ui-text-dimmed);
    --map-form-disabled-bg: var(--ui-bg-accented);
}
</style>
