<script setup lang="ts">
/** 경로정보 마커 클릭 시 표시되는 오버레이 팝업 */
defineProps<{
    name: string
    description: string
    authorName?: string
}>()

defineEmits<{
    close: []
}>()
</script>

<template>
    <div class="route-info-marker-popup">
        <div class="route-info-marker-popup__header">
            <span class="route-info-marker-popup__name">{{ name }}</span>
            <button class="route-info-marker-popup__close" @click="$emit('close')">
                <UIcon name="i-lucide-x" />
            </button>
        </div>
        <p class="route-info-marker-popup__description">{{ description }}</p>
        <span v-if="authorName" class="route-info-marker-popup__author">{{ authorName }}</span>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/RouteInfoMarkerPopup.css"></style>
