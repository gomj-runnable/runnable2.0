<script setup lang="ts">
defineProps<{
    /** 다른 범례(날씨/고도)가 표시 중인지 여부 */
    hasOtherLegend?: boolean
}>()
</script>

<template>
    <div
        class="gradient-legend"
        :class="{ 'gradient-legend--stacked': hasOtherLegend }"
    >
        <p class="gradient-legend__title">경사도</p>
        <div class="gradient-legend__list">
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #4CAF50" />
                완만 (0~3%)
            </div>
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #FFC107" />
                약간 가파름 (3~7%)
            </div>
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #FF9800" />
                가파름 (7~12%)
            </div>
            <div class="gradient-legend__item">
                <span class="gradient-legend__swatch" style="background: #F44336" />
                매우 가파름 (12%+)
            </div>
        </div>
    </div>
</template>

<style scoped src="~/assets/css/components/molecules/GradientLegend.css"></style>
