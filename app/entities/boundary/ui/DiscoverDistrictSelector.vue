<script setup lang="ts">
import { useDistrictStore } from '~/entities/boundary/model/useDistrictStore'

const { guNames } = useDistrictStore()

defineProps<{
    /** 현재 선택된 구 이름. 선택 없음이면 `null`. */
    modelValue: string | null
}>()

defineEmits<{
    /** 구 선택 시 선택된 구 이름을 전달. 이미 선택된 구 클릭 시 `null` 전달. */
    'update:modelValue': [district: string | null]
}>()
</script>

<template>
    <div class="flex flex-col gap-2.5 w-full">
        <div class="map-section-label">구역 선택</div>
        <div class="flex flex-wrap gap-1.5">
            <button
                v-for="district in guNames"
                :key="district"
                class="px-2.5 py-1 text-xs font-medium leading-[1.4] text-text-muted bg-transparent border border-border-accent rounded-full cursor-pointer transition-[background,color,border-color] duration-150 whitespace-nowrap hover:bg-accent-hover hover:text-text-base hover:border-[var(--ui-primary)]"
                :class="{
                    'bg-accent-tint !text-[var(--ui-primary)] !border-[var(--ui-primary)]': modelValue === district
                }"
                type="button"
                @click="$emit('update:modelValue', modelValue === district ? null : district)"
            >
                {{ district }}
            </button>
        </div>
    </div>
</template>
