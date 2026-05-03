<script setup lang="ts">
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
        <div class="flex items-center justify-between gap-2.5 shrink-0">
            <h2 class="m-0 text-lg font-bold leading-[1.2] text-text-base">{{ panelTitle }}</h2>
            <div class="flex items-center gap-2.5 shrink-0">
                <button
                    type="button"
                    class="px-3 py-1 text-[0.8125rem] font-medium text-text-muted bg-accent-tint border border-border-accent rounded-xl cursor-pointer transition duration-150 hover:bg-accent-hover hover:text-text-base"
                    :class="
                        isEditMode
                            ? 'bg-accent-tint border-[var(--ui-primary)] text-text-base'
                            : ''
                    "
                    @click="emit('update:editMode', !isEditMode)"
                >
                    {{ isEditMode ? '저장하기' : '수정하기' }}
                </button>
                <button
                    type="button"
                    class="flex items-center justify-center w-7 h-7 text-text-muted bg-transparent border-none rounded-lg cursor-pointer transition duration-150 hover:bg-accent-hover hover:text-text-base"
                    aria-label="닫기"
                    @click="emit('close')"
                >
                    <UIcon name="i-lucide-x" />
                </button>
            </div>
        </div>

        <div
            class="flex gap-4 px-3 py-2.5 bg-accent-tint rounded-2xl border border-border-accent shrink-0"
        >
            <span class="flex flex-col gap-1">
                <span class="text-xs text-text-muted leading-[1.4]">총 거리</span>
                <span class="text-[0.9375rem] font-semibold text-text-base leading-[1.4]"
                    >{{ totalDistance.toFixed(1) }}km</span
                >
            </span>
            <span class="flex flex-col gap-1">
                <span class="text-xs text-text-muted leading-[1.4]">예상 소요시간</span>
                <span class="text-[0.9375rem] font-semibold text-text-base leading-[1.4]">{{
                    totalTime
                }}</span>
            </span>
        </div>

        <div class="flex flex-col gap-2.5">
            <div
                v-for="section in sections"
                :key="section.sectionId"
                class="flex flex-col gap-2.5 p-3 bg-accent-tint border border-border-accent rounded-2xl"
            >
                <div class="flex items-center justify-between gap-2.5">
                    <span class="text-sm font-semibold text-text-base leading-[1.4]">
                        {{ section.attrs?.[0]?.name ?? '구간' }}
                    </span>
                    <span v-if="section.geom" class="text-xs text-text-muted leading-[1.4]">
                        {{ calculateSectionDistance(section).toFixed(1) }}km
                    </span>
                </div>

                <div v-if="!isEditMode" class="flex flex-col gap-1.5">
                    <p
                        v-if="section.attrs?.[0]?.comment"
                        class="m-0 text-sm font-medium text-text-muted leading-[1.5]"
                    >
                        {{ section.attrs[0].comment }}
                    </p>
                    <p
                        v-if="section.attrs?.[0]?.description"
                        class="m-0 text-[0.8125rem] text-meta leading-[1.5]"
                    >
                        {{ section.attrs[0].description }}
                    </p>
                </div>

                <div class="flex items-center justify-between gap-2.5">
                    <span class="text-[0.8125rem] text-text-muted leading-[1.4]">페이스</span>
                    <span
                        class="text-[0.8125rem] font-medium text-text-base leading-[1.4] [font-variant-numeric:tabular-nums]"
                    >
                        {{
                            userPaces[section.sectionId]?.pace != null
                                ? formatPace(userPaces[section.sectionId]?.pace!)
                                : '-'
                        }}
                    </span>
                </div>
                <USlider
                    v-if="isEditMode"
                    :model-value="userPaces[section.sectionId]?.pace ?? 300"
                    :min="180"
                    :max="600"
                    :step="5"
                    class="w-full"
                    @update:model-value="
                        (v: number | undefined) => emit('update:pace', section.sectionId, v ?? 300)
                    "
                />

                <div class="flex items-center justify-between gap-2.5">
                    <span class="text-[0.8125rem] text-text-muted leading-[1.4]">짐 무게</span>
                    <span
                        class="text-[0.8125rem] font-medium text-text-base leading-[1.4] [font-variant-numeric:tabular-nums]"
                    >
                        {{
                            userPaces[section.sectionId]?.weight != null
                                ? `${userPaces[section.sectionId]?.weight}kg`
                                : '-'
                        }}
                    </span>
                </div>
                <USlider
                    v-if="isEditMode"
                    :model-value="userPaces[section.sectionId]?.weight ?? 0"
                    :min="0"
                    :max="30"
                    :step="0.5"
                    class="w-full"
                    @update:model-value="
                        (v: number | undefined) => emit('update:weight', section.sectionId, v ?? 0)
                    "
                />

                <textarea
                    v-if="isEditMode"
                    :value="userPaces[section.sectionId]?.strategy ?? ''"
                    rows="2"
                    placeholder="구간 전략을 입력하세요"
                    class="w-full resize-y px-3 py-2.5 text-sm text-text-base bg-accent-tint border border-border-accent rounded-xl box-border font-[inherit] leading-[1.5] transition-[border-color] duration-150 outline-none placeholder:text-meta focus:border-[var(--ui-primary)]"
                    @blur="
                        emit(
                            'update:strategy',
                            section.sectionId,
                            ($event.target as HTMLTextAreaElement).value
                        )
                    "
                />
            </div>
        </div>
    </div>
</template>
