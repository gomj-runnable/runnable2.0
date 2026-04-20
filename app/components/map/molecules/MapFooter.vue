<script setup lang="ts">
/**
 * 화면 하단에 카메라·위치 정보를 표시하는 footer 컴포넌트.
 * useCameraStore의 footerLabel을 그대로 출력한다.
 */
defineProps<{
    label: string
}>()
</script>

<template>
    <footer class="map-footer">
        <span class="map-footer__label">{{ label }}</span>
    </footer>
</template>

<style scoped src="~/assets/css/components/molecules/MapFooter.css"></style>
