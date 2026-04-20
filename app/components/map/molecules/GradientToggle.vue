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

<style scoped src="~/assets/css/components/molecules/GradientToggle.css"></style>
