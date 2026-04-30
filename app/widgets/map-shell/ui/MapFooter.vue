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
    <footer class="flex items-center justify-end pointer-events-none">
        <span class="text-xs text-[#58616a] [font-variant-numeric:tabular-nums] whitespace-nowrap select-none py-1 px-2.5 m-0 bg-[color-mix(in_srgb,color-mix(in_srgb,#1e2124_92%,transparent)_75%,transparent)] backdrop-blur-[12px] rounded-[1rem_0_0_0]">{{ label }}</span>
    </footer>
</template>
