<script setup lang="ts">
// 경로 그리기 패널 UI — 구간 목록, GPX 가져오기, 구간 나누기 안내 모달을 포함한다.
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import type { PoiDraftInput } from '#shared/types/facility'
import { getSectionColor } from '~/entities/route/lib/useRouteDrawUtils'
import TextfieldCard from '~/shared/ui/cards/TextfieldCard.vue'

defineProps<{
    /** 경로 구간별 속성 목록 (제목·요약·설명) */
    sectionAttrs: SectionAttrSchema[]
    /** 구간별 거리 (km) */
    sectionDistances?: number[]
    /** 구간 인덱스별 연결된 POI 배열 */
    sectionPois?: Record<number, PoiDraftInput[]>
    /** 현재 POI 연결 대상 구간 인덱스 */
    activeSectionIndex?: number | null
}>()

/** 구간 나누기 안내 모달 */
const showSplitGuide = ref(false)
const pendingSplitIndex = ref<number | null>(null)

const openSplitGuide = (index: number) => {
    pendingSplitIndex.value = index
    showSplitGuide.value = true
}

const confirmSplit = () => {
    if (pendingSplitIndex.value !== null) {
        emit('addSection', { index: pendingSplitIndex.value })
    }
    showSplitGuide.value = false
    pendingSplitIndex.value = null
}

const gpxFileInput = ref<HTMLInputElement | null>(null)

function handleGpxFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        emit('importGpx', file)
    }
    if (gpxFileInput.value) gpxFileInput.value.value = ''
}

const emit = defineEmits<{
    /** 경로 초기화 버튼 클릭 시 발생 */
    reset: []
    /** 경로 저장 버튼 클릭 시 발생 */
    save: []
    /** GPX 파일 가져오기 클릭 시 선택된 파일을 전달 */
    importGpx: [file: File]
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
    /** 특정 구간 뒤에 새 구간을 삽입할 때 해당 인덱스를 전달 */
    addSection: [payload: { index: number }]
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

        <input
            ref="gpxFileInput"
            type="file"
            accept=".gpx"
            class="hidden"
            @change="handleGpxFileChange"
        />
        <UButton
            icon="i-lucide-upload"
            variant="outline"
            color="neutral"
            block
            label="GPX 가져오기"
            @click="gpxFileInput?.click()"
        />

        <div class="map-section-label">구간 목록</div>

        <div class="flex flex-col gap-2.5">
            <div
                v-for="(sectionAttr, index) in sectionAttrs"
                :key="`section-item-${index}`"
                class="flex flex-col gap-1"
            >
                <div
                    v-if="sectionDistances?.[index] != null"
                    class="text-xs text-[var(--ui-text-muted)] px-1 mb-0.5"
                >
                    {{ sectionDistances[index]!.toFixed(2) }}km
                </div>
                <TextfieldCard
                    :deletable="index > 0"
                    :selected="activeSectionIndex === index"
                    :section-color="getSectionColor(index)"
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
                />
                <div
                    v-if="(sectionPois?.[index] ?? []).length > 0"
                    class="flex flex-wrap gap-1 px-1"
                >
                    <UBadge
                        v-for="(poi, poiIndex) in sectionPois?.[index] ?? []"
                        :key="`poi-${index}-${poiIndex}`"
                        color="info"
                        variant="subtle"
                        size="sm"
                        class="max-w-[120px]"
                        :title="poi.name"
                    >
                        <UIcon :name="POI_ICON[poi.type] ?? 'i-lucide-map-pin'" class="shrink-0" />
                        <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{
                            poi.name
                        }}</span>
                        <UButton
                            icon="i-lucide-x"
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            class="shrink-0 -mr-1"
                            :aria-label="`${poi.name} 제거`"
                            @click.stop="$emit('removePoi', { sectionIndex: index, poiIndex })"
                        />
                    </UBadge>
                </div>
                <UButton
                    v-if="(sectionDistances?.[index] ?? 0) > 0"
                    icon="i-lucide-split"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    label="구간 나누기"
                    class="self-center mt-1"
                    @click.stop="openSplitGuide(index)"
                />
            </div>
        </div>

        <!-- 구간 나누기 안내 모달 -->
        <UModal v-model:open="showSplitGuide" title="구간 나누기">
            <template #body>
                <div class="flex flex-col gap-3 text-sm text-[var(--ui-text-muted)]">
                    <p class="font-medium text-[var(--ui-text-highlighted)]">구간을 나누는 방법</p>
                    <ol class="list-decimal list-inside flex flex-col gap-2">
                        <li>
                            <strong>분할 지점 선택</strong> — 지도 위에 표시된
                            <span class="text-[var(--ui-primary)]">작은 점</span>을 클릭하여 구간을
                            나눌 위치를 선택합니다.
                        </li>
                        <li>
                            <strong>위치 조정</strong> — 점을 드래그하면 경로 포인트의 위치를 조정할
                            수 있습니다.
                        </li>
                        <li>
                            <strong>저장</strong> — 상단 저장 버튼을 눌러 변경사항을 적용합니다.
                        </li>
                    </ol>
                    <p class="text-xs text-[var(--ui-text-dimmed)]">
                        포인트가 2개 미만인 구간은 나눌 수 없습니다.
                    </p>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        variant="outline"
                        color="neutral"
                        label="취소"
                        @click="showSplitGuide = false"
                    />
                    <UButton
                        variant="solid"
                        color="primary"
                        label="구간 나누기 시작"
                        @click="confirmSplit"
                    />
                </div>
            </template>
        </UModal>
    </div>
</template>
