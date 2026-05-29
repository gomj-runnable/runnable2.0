<script setup lang="ts">
/**
 * 선택 지역의 인도(보행로)를 지도에 표시하는 chip 플러그인.
 * facility 기능에서 분리되어 독립 플러그인으로 동작한다.
 * 위치는 PluginChipLayer 가 manifest.position 기준으로 관리한다.
 */
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import { useSidewalkSideeffect } from '~/entities/facility/api/useSidewalkSideeffect'
import { useMapViewer } from '~/shared/lib/map/useMapViewer'

const { viewer } = useMapViewer()
useSidewalkSideeffect({ viewer })

const sidewalk = useSidewalkStore()
</script>

<template>
    <UButton
        label="인도 표시"
        icon="i-lucide-route"
        size="md"
        :loading="sidewalk.isLoading.value"
        :variant="sidewalk.isActive.value ? 'solid' : 'outline'"
        :color="sidewalk.isActive.value ? 'primary' : 'neutral'"
        class="rounded-full shadow"
        @click="sidewalk.toggleActive()"
    />
</template>
