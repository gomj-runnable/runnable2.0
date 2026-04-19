<script setup lang="ts">
import ChipButton from '~/components/map/molecules/buttons/ChipButton.vue'
import HoverTooltip from '~/components/map/atoms/HoverTooltip.vue'
import { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'

const props = defineProps<{
    active: boolean
    difficulty: DifficultyLevelEnum | null
}>()

defineEmits<{
    toggle: []
}>()

const difficultyLabel = computed(() => props.difficulty?.label ?? null)
const difficultyColor = computed(() => props.difficulty?.color ?? null)
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
        <HoverTooltip v-if="active && difficultyLabel" placement="top" :offset="8">
            <template #trigger>
                <span
                    class="gradient-toggle__badge"
                    :style="{ backgroundColor: difficultyColor ?? undefined }"
                >
                    {{ difficultyLabel }}
                </span>
            </template>
            <template #content>
                <p class="gradient-toggle__tooltip-title">난이도 판정 기준</p>
                <table class="gradient-toggle__tooltip-table">
                    <thead>
                        <tr>
                            <th />
                            <th>거리</th>
                            <th>상승고도</th>
                            <th>최대경사</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="gradient-toggle__dot" style="background:#4CAF50" />초급</td>
                            <td>~5km</td>
                            <td>~100m</td>
                            <td>~3%</td>
                        </tr>
                        <tr>
                            <td><span class="gradient-toggle__dot" style="background:#FFC107" />중급</td>
                            <td>5~10km</td>
                            <td>100~300m</td>
                            <td>3~7%</td>
                        </tr>
                        <tr>
                            <td><span class="gradient-toggle__dot" style="background:#FF9800" />고급</td>
                            <td>10~20km</td>
                            <td>300~600m</td>
                            <td>7~12%</td>
                        </tr>
                        <tr>
                            <td><span class="gradient-toggle__dot" style="background:#F44336" />전문가</td>
                            <td>20km+</td>
                            <td>600m+</td>
                            <td>12%+</td>
                        </tr>
                    </tbody>
                </table>
                <p class="gradient-toggle__tooltip-note">세 기준 중 가장 높은 등급 적용</p>
            </template>
        </HoverTooltip>
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
    cursor: default;
}

.gradient-toggle__tooltip-title {
    font-size: var(--text-caption);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--gap-2);
}

.gradient-toggle__tooltip-table {
    border-collapse: collapse;
    font-size: 11px;
    color: var(--text-secondary);
}

.gradient-toggle__tooltip-table th {
    font-weight: 600;
    color: var(--text-muted);
    text-align: left;
    padding: 2px 8px 2px 0;
    border-bottom: 1px solid var(--color-border-default);
}

.gradient-toggle__tooltip-table td {
    padding: 3px 8px 3px 0;
}

.gradient-toggle__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
}

.gradient-toggle__tooltip-note {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: var(--gap-2);
    font-style: italic;
}
</style>
