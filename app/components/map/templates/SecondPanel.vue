<script setup lang="ts">
import type { SavedSection } from '#shared/types/route'
import type { UserPace } from '#shared/types/user-route'
import { formatPace, calculateSectionDistance } from '~/composables/action/usePaceCalculator'

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
    <div class="second-panel">
        <div class="second-panel__header">
            <h2 class="second-panel__title">{{ panelTitle }}</h2>
            <div class="second-panel__header-actions">
                <button
                    type="button"
                    class="second-panel__edit-btn"
                    :class="{ 'is-active': isEditMode }"
                    @click="emit('update:editMode', !isEditMode)"
                >
                    {{ isEditMode ? '저장하기' : '수정하기' }}
                </button>
                <button
                    type="button"
                    class="second-panel__close-btn"
                    aria-label="닫기"
                    @click="emit('close')"
                >
                    <UIcon name="i-lucide-x" />
                </button>
            </div>
        </div>

        <div class="second-panel__route-info">
            <span class="second-panel__route-stat">
                <span class="second-panel__route-stat-label">총 거리</span>
                <span class="second-panel__route-stat-value">{{ totalDistance.toFixed(1) }}km</span>
            </span>
            <span class="second-panel__route-stat">
                <span class="second-panel__route-stat-label">예상 소요시간</span>
                <span class="second-panel__route-stat-value">{{ totalTime }}</span>
            </span>
        </div>

        <div class="second-panel__section-list">
            <div
                v-for="section in sections"
                :key="section.sectionId"
                class="second-panel__section-card"
            >
                <div class="second-panel__section-header">
                    <span class="second-panel__section-name">
                        {{ section.attrs?.[0]?.name ?? '구간' }}
                    </span>
                    <span v-if="section.geom" class="second-panel__section-distance">
                        {{ calculateSectionDistance(section).toFixed(1) }}km
                    </span>
                </div>

                <div v-if="!isEditMode" class="second-panel__section-body">
                    <p v-if="section.attrs?.[0]?.comment" class="second-panel__section-comment">
                        {{ section.attrs[0].comment }}
                    </p>
                    <p
                        v-if="section.attrs?.[0]?.description"
                        class="second-panel__section-description"
                    >
                        {{ section.attrs[0].description }}
                    </p>
                </div>

                <div class="second-panel__slider-row">
                    <span class="second-panel__slider-label">페이스</span>
                    <span class="second-panel__slider-value">
                        {{
                            userPaces[section.sectionId]?.pace != null
                                ? formatPace(userPaces[section.sectionId].pace!)
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
                    class="second-panel__slider"
                    @update:model-value="emit('update:pace', section.sectionId, $event)"
                />

                <div class="second-panel__slider-row">
                    <span class="second-panel__slider-label">짐 무게</span>
                    <span class="second-panel__slider-value">
                        {{
                            userPaces[section.sectionId]?.weight != null
                                ? `${userPaces[section.sectionId].weight}kg`
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
                    class="second-panel__slider"
                    @update:model-value="emit('update:weight', section.sectionId, $event)"
                />

                <textarea
                    v-if="isEditMode"
                    :value="userPaces[section.sectionId]?.strategy ?? ''"
                    rows="2"
                    placeholder="구간 전략을 입력하세요"
                    class="second-panel__strategy-textarea"
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

<style scoped src="~/assets/css/components/templates/SecondPanel.css"></style>
