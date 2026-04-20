<script setup lang="ts">
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import type { PoiDraftInput } from '#shared/types/facility'
import TextfieldCard from '~/shared/ui/cards/TextfieldCard.vue'
import Button from '~/shared/ui/buttons/Button.vue'

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
    <div class="draw-route-panel">
        <div class="map-section-label">경로 그리기</div>

        <div class="draw-route-panel__actions">
            <Button
                icon="i-lucide-rotate-ccw"
                appearance="secondary"
                role="cancel"
                block
                @click="$emit('reset')"
            >
                초기화
            </Button>
            <Button icon="i-lucide-save" appearance="tinted" block @click="$emit('save')">
                저장
            </Button>
        </div>

        <div class="map-section-label">구간 목록</div>

        <div class="draw-route-panel__section-list">
            <div
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-item-${index}`"
                class="draw-route-panel__section-item"
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
                    class="draw-route-panel__poi-list"
                >
                    <span
                        v-for="(poi, poiIndex) in sectionPois?.[index] ?? []"
                        :key="`poi-${index}-${poiIndex}`"
                        class="draw-route-panel__poi-chip"
                        :title="poi.name"
                    >
                        <UIcon
                            :name="POI_ICON[poi.type] ?? 'i-lucide-map-pin'"
                            class="draw-route-panel__poi-icon"
                        />
                        <span class="draw-route-panel__poi-name">{{ poi.name }}</span>
                        <button
                            type="button"
                            class="draw-route-panel__poi-remove"
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

<style scoped src="./DrawRoutePanel.css"></style>
