<script setup lang="ts">
// 경로 구간별 페이스·짐 무게·전략을 조회하고 수정하는 구간 상세 패널 컴포넌트.
import type { SavedSection } from '#shared/types/route'
import type { UserPace } from '#shared/types/user-route'
import { formatPace, calculateSectionDistance } from '~/entities/route/lib/usePaceCalculator'

defineProps<{
    panelTitle: string
    sections: SavedSection[]
    userPaces: Record<string, UserPace>
    totalDistance: number
    totalTime: string
    isEditMode: boolean
    /** 읽기 전용 모드 (탐색 탭에서 사용) */
    readOnly?: boolean
}>()

const emit = defineEmits<{
    'update:editMode': [value: boolean]
    'update:pace': [sectionId: string, pace: number]
    'update:weight': [sectionId: string, weight: number]
    'update:strategy': [sectionId: string, strategy: string]
    close: []
}>()
</script>

<template>
    <div class="flex flex-col gap-3 w-full h-full p-4 box-border overflow-y-auto">
        <!-- 헤더 -->
        <div class="flex items-center justify-between gap-2.5 shrink-0">
            <h2 class="m-0 text-lg font-bold leading-[1.2] text-[var(--ui-text-highlighted)]">
                {{ panelTitle }}
            </h2>
            <div class="flex items-center gap-2 shrink-0">
                <UButton
                    v-if="!readOnly"
                    :label="isEditMode ? '저장하기' : '수정하기'"
                    size="xs"
                    :variant="isEditMode ? 'solid' : 'outline'"
                    :color="isEditMode ? 'primary' : 'neutral'"
                    @click="emit('update:editMode', !isEditMode)"
                />
                <UButton
                    icon="i-lucide-x"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="닫기"
                    @click="emit('close')"
                />
            </div>
        </div>

        <!-- 요약 카드 -->
        <UCard variant="subtle" :ui="{ body: 'p-3' }">
            <div class="flex gap-4">
                <span class="flex flex-col gap-1">
                    <span class="text-xs text-[var(--ui-text-muted)]">총 거리</span>
                    <span class="text-[0.9375rem] font-semibold text-[var(--ui-text-highlighted)]">
                        {{ totalDistance.toFixed(1) }}km
                    </span>
                </span>
                <span class="flex flex-col gap-1">
                    <span class="text-xs text-[var(--ui-text-muted)]">예상 소요시간</span>
                    <span class="text-[0.9375rem] font-semibold text-[var(--ui-text-highlighted)]">
                        {{ totalTime }}
                    </span>
                </span>
            </div>
        </UCard>

        <!-- 구간 목록 -->
        <div class="flex flex-col gap-2.5">
            <UCard
                v-for="section in sections"
                :key="section.sectionId"
                variant="subtle"
                :ui="{ body: 'p-3' }"
            >
                <!-- 구간 헤더 -->
                <div class="flex items-center justify-between gap-2.5">
                    <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                        {{ section.attrs?.[0]?.name ?? '구간' }}
                    </span>
                    <span v-if="section.geom" class="text-xs text-[var(--ui-text-muted)]">
                        {{ calculateSectionDistance(section).toFixed(1) }}km
                    </span>
                </div>

                <!-- 코멘트/설명 (보기 모드) -->
                <div v-if="!isEditMode" class="flex flex-col gap-1.5 mt-2">
                    <p
                        v-if="section.attrs?.[0]?.comment"
                        class="m-0 text-sm font-medium text-[var(--ui-text-muted)]"
                    >
                        {{ section.attrs[0].comment }}
                    </p>
                    <p
                        v-if="section.attrs?.[0]?.description"
                        class="m-0 text-[0.8125rem] text-[var(--ui-text-dimmed)]"
                    >
                        {{ section.attrs[0].description }}
                    </p>
                </div>

                <!-- 페이스 -->
                <div class="flex items-center justify-between gap-2.5 mt-2">
                    <span class="text-[0.8125rem] text-[var(--ui-text-muted)]">페이스</span>
                    <span
                        class="text-[0.8125rem] font-medium text-[var(--ui-text-highlighted)] [font-variant-numeric:tabular-nums]"
                    >
                        {{
                            userPaces[section.sectionId]?.pace != null
                                ? formatPace(userPaces[section.sectionId]?.pace!)
                                : '-'
                        }}
                    </span>
                </div>
                <USlider
                    v-if="isEditMode && !readOnly"
                    :model-value="userPaces[section.sectionId]?.pace ?? 300"
                    :min="180"
                    :max="600"
                    :step="5"
                    class="w-full mt-1"
                    @update:model-value="
                        (v: number | undefined) => emit('update:pace', section.sectionId, v ?? 300)
                    "
                />

                <!-- 짐 무게 -->
                <div class="flex items-center justify-between gap-2.5 mt-2">
                    <span class="text-[0.8125rem] text-[var(--ui-text-muted)]">짐 무게</span>
                    <span
                        class="text-[0.8125rem] font-medium text-[var(--ui-text-highlighted)] [font-variant-numeric:tabular-nums]"
                    >
                        {{
                            userPaces[section.sectionId]?.weight != null
                                ? `${userPaces[section.sectionId]?.weight}kg`
                                : '-'
                        }}
                    </span>
                </div>
                <USlider
                    v-if="isEditMode && !readOnly"
                    :model-value="userPaces[section.sectionId]?.weight ?? 0"
                    :min="0"
                    :max="30"
                    :step="0.5"
                    class="w-full mt-1"
                    @update:model-value="
                        (v: number | undefined) => emit('update:weight', section.sectionId, v ?? 0)
                    "
                />

                <!-- 구간 전략 -->
                <UTextarea
                    v-if="isEditMode && !readOnly"
                    :model-value="userPaces[section.sectionId]?.strategy ?? ''"
                    :rows="2"
                    autoresize
                    placeholder="구간 전략을 입력하세요"
                    variant="subtle"
                    class="mt-2"
                    @blur="
                        emit(
                            'update:strategy',
                            section.sectionId,
                            ($event.target as HTMLTextAreaElement).value
                        )
                    "
                />
            </UCard>
        </div>
    </div>
</template>
