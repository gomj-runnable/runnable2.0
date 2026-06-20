<script setup lang="ts">
/**
 * 그리기 탭 panel (path: `/draw`).
 * 부모 컨텍스트의 drawing facade 와 구간 거리 배열을 DrawTab 에 연결한다.
 */
import { useMapPageContext } from '~/widgets/map-shell/model/useMapPageContext'
import DrawTab from '~/widgets/map-shell/ui/slide-over/DrawTab.vue'

const { facade, flow } = useMapPageContext()
const { sectionDistances } = flow
</script>

<template>
    <DrawTab
        :drawing="facade.drawing"
        :section-distances="sectionDistances"
        @drawing-start="facade.drawing.start()"
    />
</template>
