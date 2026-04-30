<script setup lang="ts">
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import type { PoiDraftInput } from '#shared/types/facility'
import TextfieldCard from '~/shared/ui/cards/TextfieldCard.vue'

defineProps<{
    /** 경로 구간별 속성 목록 (제목·요약·설명) */
    sectionAttrs: SectionAttrSchema[]
    /** 구간 인덱스별 연결된 POI 배열 */
    sectionPois?: Record<number, PoiDraftInput[]>
    /** 현재 POI 연결 대상 구간 인덱스 */
    activeSectionIndex?: number | null
}>()

defineEmits<{
    /** 경로 초기화 버튼 클릭 시 발생 */
    reset: []
    /** 경로 저장 버튼 클릭 시 발생 */
    save: []
    /** 특정 구간의 필드 값이 변경될 때 인덱스·필드명·값을 전달 */
    updateSectionAttr: [
        payload: { index: number; field: 'name' | 'comment' | 'description'; value: string }
    ]
    /** 특정 구간을 삭제할 때 해당 인덱스를 전달 */
    removeSection: [payload: { index: number }]
    /** 구간에서 POI를 제거할 때 구간 인덱스와 POI 인덱스를 전달 */
    removePoi: [payload: { sectionIndex: number; poiIndex: number }]
    /** 구간 카드 클릭 시 해당 인덱스를 전달 (POI 연결 활성화) */
    selectSection: [payload: { index: number }]
}>()

/** POI 타입별 아이콘 */
const POI_ICON: Record<string, string> = {
    HOSPITAL: 'i-lucide-cross',
    CROSSWALK: 'i-lucide-footprints',
    WATER: 'i-lucide-droplets'
}
</script>

<template>
    <div class="flex flex-col gap-3 w-full">
        <div class="map-section-label">경로 그리기</div>

        <div class="grid grid-cols-2 gap-2.5">
            <UButton
                icon="i-lucide-rotate-ccw"
                variant="outline"
                color="neutral"
                block
                label="초기화"
                @click="$emit('reset')"
            />
            <UButton
                icon="i-lucide-save"
                variant="subtle"
                color="primary"
                block
                label="저장"
                @click="$emit('save')"
            />
        </div>

        <div class="map-section-label">구간 목록</div>

        <div class="flex flex-col gap-2.5">
            <div
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-item-${index}`"
                class="flex flex-col gap-1"
            >
                <TextfieldCard
                    :deletable="index > 0"
                    :selected="activeSectionIndex === index"
                    :title-field="{
                        id: 'name',
                        modelValue: sectionAttr.name || '',
                        placeholder: `구간제목${index + 1}`
                    }"
                    :fields="[
                        {
                            id: 'comment',
                            modelValue: sectionAttr.comment || '',
                            placeholder: '구간 요약',
                            maxLength: 80
                        },
                        {
                            id: 'description',
                            modelValue: sectionAttr.description || '',
                            placeholder: '구간 설명',
                            multiline: true,
                            rows: 2
                        }
                    ]"
                    tabindex="0"
                    role="button"
                    @update:field="
                        $emit('updateSectionAttr', {
                            index,
                            field: $event.id as 'name' | 'comment' | 'description',
                            value: $event.value
                        })
                    "
                    @click="$emit('selectSection', { index })"
                    @keydown.enter="$emit('selectSection', { index })"
                    @delete="$emit('removeSection', { index })"
                >
                    <template #meta>
                        {{ `포인트 ${index + 1}` }}
                    </template>
                </TextfieldCard>
                <div
                    v-if="(sectionPois?.[index] ?? []).length > 0"
                    class="flex flex-wrap gap-1 px-1"
                >
                    <span
                        v-for="(poi, poiIndex) in sectionPois?.[index] ?? []"
                        :key="`poi-${index}-${poiIndex}`"
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[rgba(33,150,243,0.12)] text-[11px] text-[#cdd1d5] max-w-[120px]"
                        :title="poi.name"
                    >
                        <UIcon
                            :name="POI_ICON[poi.type] ?? 'i-lucide-map-pin'"
                            class="shrink-0 text-[12px]"
                        />
                        <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ poi.name }}</span>
                        <button
                            type="button"
                            class="inline-flex items-center justify-center shrink-0 bg-none border-none cursor-pointer p-0 text-[#58616a] text-[10px] leading-none"
                            :aria-label="`${poi.name} 제거`"
                            @click.stop="$emit('removePoi', { sectionIndex: index, poiIndex })"
                        >
                            <UIcon name="i-lucide-x" />
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
