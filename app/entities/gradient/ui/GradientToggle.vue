<script setup lang="ts">
import type { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'

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
    <div class="flex items-center gap-1">
        <UButton
            label="경사도"
            icon="i-lucide-trending-up"
            size="sm"
            :variant="active ? 'solid' : 'outline'"
            :color="active ? 'primary' : 'neutral'"
            @click="$emit('toggle')"
        />
        <UTooltip v-if="active && difficultyLabel">
            <span
                class="inline-flex items-center px-1.5 py-1 rounded-lg text-xs font-semibold text-black leading-[1.4] whitespace-nowrap cursor-default"
                :style="{ backgroundColor: difficultyColor ?? undefined }"
            >
                {{ difficultyLabel }}
            </span>
            <template #content>
                <p class="text-xs font-semibold text-text-base mb-1.5">난이도 판정 기준</p>
                <table class="border-collapse text-xs text-text-muted">
                    <thead>
                        <tr>
                            <th class="px-1.5 py-0.5 text-left" />
                            <th class="px-1.5 py-0.5 text-left">거리</th>
                            <th class="px-1.5 py-0.5 text-left">상승고도</th>
                            <th class="px-1.5 py-0.5 text-left">최대경사</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- difficulty colors below are data visualization values — do not replace with theme tokens -->
                        <tr>
                            <td class="px-1.5 py-0.5">
                                <span
                                    class="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                                    style="background: #4caf50"
                                />초급
                            </td>
                            <td class="px-1.5 py-0.5">~5km</td>
                            <td class="px-1.5 py-0.5">~100m</td>
                            <td class="px-1.5 py-0.5">~3%</td>
                        </tr>
                        <tr>
                            <td class="px-1.5 py-0.5">
                                <span
                                    class="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                                    style="background: #ffc107"
                                />중급
                            </td>
                            <td class="px-1.5 py-0.5">5~10km</td>
                            <td class="px-1.5 py-0.5">100~300m</td>
                            <td class="px-1.5 py-0.5">3~7%</td>
                        </tr>
                        <tr>
                            <td class="px-1.5 py-0.5">
                                <span
                                    class="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                                    style="background: #ff9800"
                                />고급
                            </td>
                            <td class="px-1.5 py-0.5">10~20km</td>
                            <td class="px-1.5 py-0.5">300~600m</td>
                            <td class="px-1.5 py-0.5">7~12%</td>
                        </tr>
                        <tr>
                            <td class="px-1.5 py-0.5">
                                <span
                                    class="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                                    style="background: #f44336"
                                />전문가
                            </td>
                            <td class="px-1.5 py-0.5">20km+</td>
                            <td class="px-1.5 py-0.5">600m+</td>
                            <td class="px-1.5 py-0.5">12%+</td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-xs text-meta mt-1.5 italic">세 기준 중 가장 높은 등급 적용</p>
            </template>
        </UTooltip>
    </div>
</template>
