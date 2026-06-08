<script setup lang="ts">
// 헤더에서 베이스맵(위성영상↔기본지도)을 토글하는 버튼.
import { useBaseMapStore } from '../model/useBaseMapStore'

const store = useBaseMapStore()

/** 위성영상일 땐 지도 아이콘, 기본지도일 땐 위성 아이콘(전환 대상 표시) */
const icon = computed(() => (store.isSatellite.value ? 'i-lucide-map' : 'i-lucide-satellite'))

/** 클릭 시 전환될 대상 라벨 */
const targetLabel = computed(() => (store.isSatellite.value ? '기본지도' : '위성영상'))
</script>

<template>
    <UButton
        :icon="icon"
        color="neutral"
        variant="ghost"
        :aria-label="`${targetLabel}(으)로 전환`"
        @click="store.toggle()"
    />
</template>
