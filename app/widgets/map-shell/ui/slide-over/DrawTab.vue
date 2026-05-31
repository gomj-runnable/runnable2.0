<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, @typescript-eslint/no-explicit-any */
// SlideOver 그리기 탭 — DrawRoutePanel을 래핑해 drawing facade와 구간 거리 배열을 연결한다.
import DrawRoutePanel from '~/features/draw-route/ui/DrawRoutePanel.vue'

defineProps<{
    drawing: any
    sectionDistances: number[]
}>()

const emit = defineEmits<{
    'drawing-start': []
}>()
</script>

<template>
    <DrawRoutePanel
        :section-attrs="drawing.sectionDraft?.attrs ?? []"
        :section-distances="sectionDistances"
        :section-pois="drawing.sectionPois"
        :active-section-index="drawing.activeSectionIndex"
        @reset="emit('drawing-start')"
        @save="drawing.openSaveModal()"
        @update-section-attr="drawing.updateSectionAttr"
        @remove-section="drawing.removeSection"
        @add-section="drawing.addSection()"
        @remove-poi="drawing.removePoiFromSection($event.sectionIndex, $event.poiIndex)"
        @select-section="drawing.activeSectionIndex = $event.index"
        @import-gpx="drawing.importFromGpxFile"
    />
</template>
