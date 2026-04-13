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

<style scoped>
.map-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    pointer-events: none;
}

.map-footer__label {
    font-size: var(--text-caption);
    color: var(--color-text-subtle);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    user-select: none;
    padding: 4px 12px;
    margin: 0;
    background: color-mix(in srgb, var(--color-surface-default) 75%, transparent);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-radius: var(--radius-surface-md) 0 0 0;
}
</style>
