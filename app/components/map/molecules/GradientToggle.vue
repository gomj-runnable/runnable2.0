<script setup lang="ts">
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import type { DifficultyLevel } from '#shared/types/gradient'

const props = defineProps<{
    /** 경사도 레이어 활성화 여부 */
    active: boolean
    /** 현재 경로 난이도. 경로가 없으면 null. */
    difficulty: DifficultyLevel | null
}>()

defineEmits<{
    /** 토글 버튼 클릭 시 */
    toggle: []
}>()

/** 난이도 레벨별 한글 레이블 */
const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
    expert: '전문가'
}

/** 난이도 레벨별 색상 */
const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    beginner: '#4CAF50',
    intermediate: '#FFC107',
    advanced: '#FF9800',
    expert: '#F44336'
}

const difficultyLabel = computed(() =>
    props.difficulty ? DIFFICULTY_LABELS[props.difficulty] : null
)

const difficultyColor = computed(() =>
    props.difficulty ? DIFFICULTY_COLORS[props.difficulty] : null
)
</script>

<template>
    <div class="gradient-toggle">
        <ChipButton
            label="경사도"
            icon="i-lucide-trending-up"
            size="sm"
            appearance="elevated"
            :active="active"
            @click="$emit('toggle')"
        />
        <span
            v-if="active && difficultyLabel"
            class="gradient-toggle__badge"
            :style="{ backgroundColor: difficultyColor ?? undefined }"
        >
            {{ difficultyLabel }}
        </span>
    </div>
</template>

<style scoped>
.gradient-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
}

.gradient-toggle__badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    line-height: 1.4;
    white-space: nowrap;
}
</style>
