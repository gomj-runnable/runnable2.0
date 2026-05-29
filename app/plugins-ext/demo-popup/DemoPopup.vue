<script setup lang="ts">
/** popup 슬롯 데모 — scrollable 모달 검증용 긴 콘텐츠. */
const sections = Array.from({ length: 20 }, (_, i) => i + 1)
</script>

<template>
    <div class="space-y-4">
        <p class="text-sm text-(--ui-text-muted)">
            popup 슬롯 데모입니다. 콘텐츠가 길면 본문이 스크롤됩니다.
        </p>
        <section v-for="n in sections" :key="n" class="space-y-1">
            <h3 class="font-medium">섹션 {{ n }}</h3>
            <p class="text-sm text-(--ui-text-muted)">
                스크롤 동작 확인용 더미 문단입니다. 이 모달은 max-height 를 넘으면 본문 영역이
                세로로 스크롤됩니다.
            </p>
        </section>
    </div>
</template>
