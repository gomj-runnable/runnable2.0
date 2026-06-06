<script setup lang="ts">
import type { Facility } from '#shared/types/facility'
import { facilityAttr } from '#shared/types/facility'
import { FacilityTypeEnum } from '#shared/types/facility-type.enum'

/** 시설물 마커 클릭 시 표시되는 오버레이 팝업 */
const props = defineProps<{
    facility: Facility
}>()

defineEmits<{
    close: []
}>()

const enumInstance = computed(() => FacilityTypeEnum.from(props.facility.type))
const hours = computed(() => facilityAttr(props.facility, 'hours'))
const tel = computed(() => facilityAttr(props.facility, 'tel'))
</script>

<template>
    <UCard
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 min-w-[240px] max-w-[320px]"
        variant="subtle"
    >
        <template #header>
            <div class="flex justify-between items-start gap-2">
                <div class="flex items-center gap-1.5">
                    <UIcon
                        v-if="enumInstance"
                        :name="enumInstance.icon"
                        class="text-base shrink-0"
                        :style="{ color: enumInstance.color }"
                    />
                    <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">
                        {{ facility.name }}
                    </span>
                </div>
                <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="$emit('close')"
                />
            </div>
        </template>

        <dl class="flex flex-col gap-1 text-[0.8125rem] m-0">
            <div v-if="facility.description" class="flex gap-2">
                <dt class="text-[var(--ui-text-dimmed)] shrink-0">주소</dt>
                <dd class="m-0 text-[var(--ui-text-muted)] break-words">
                    {{ facility.description }}
                </dd>
            </div>
            <div v-if="hours" class="flex gap-2">
                <dt class="text-[var(--ui-text-dimmed)] shrink-0">시간</dt>
                <dd class="m-0 text-[var(--ui-text-muted)]">{{ hours }}</dd>
            </div>
            <div v-if="tel" class="flex gap-2">
                <dt class="text-[var(--ui-text-dimmed)] shrink-0">전화</dt>
                <dd class="m-0 text-[var(--ui-text-muted)]">{{ tel }}</dd>
            </div>
        </dl>
    </UCard>
</template>
