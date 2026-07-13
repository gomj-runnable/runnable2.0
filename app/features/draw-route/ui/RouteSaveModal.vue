<script setup lang="ts">
// 경로 제목·설명·거리·행정구역을 입력하고 저장하는 모달 컴포넌트 (신규 저장 및 수정 겸용).
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
            <div class="flex flex-col gap-3">
                <UFormField label="제목">
                    <UInput
                        class="w-full"
                        :model-value="title"
                        placeholder="경로 제목"
                        @update:model-value="$emit('update:title', $event)"
                    />
                </UFormField>

                <UFormField label="설명">
                    <UTextarea
                        class="w-full"
                        :model-value="description"
                        :rows="4"
                        placeholder="경로 설명"
                        @update:model-value="$emit('update:description', $event)"
                    />
                </UFormField>

                <UFormField label="거리">
                    <UInput
                        class="w-full"
                        :model-value="formatDistance(distance)"
                        placeholder="0.00"
                        disabled
                    />
                </UFormField>

                <UFormField v-if="districts?.length" label="행정구역">
                    <div class="text-sm text-muted leading-normal">
                        {{ districts.join(', ') }}
                    </div>
                </UFormField>
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
