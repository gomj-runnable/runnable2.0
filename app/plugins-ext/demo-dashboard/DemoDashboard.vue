<script setup lang="ts">
/** dashboard 슬롯 데모 — 넓은 모달에 렌더되는 대시보드 콘텐츠. */
const stats = [
    { label: '저장된 경로', value: '128' },
    { label: '총 거리', value: '342 km' },
    { label: '공유 링크', value: '17' },
    { label: '좋아요', value: '256' }
]
</script>

<template>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UCard v-for="s in stats" :key="s.label">
            <p class="text-sm text-(--ui-text-muted)">{{ s.label }}</p>
            <p class="text-2xl font-semibold mt-1">{{ s.value }}</p>
        </UCard>
    </div>
</template>
