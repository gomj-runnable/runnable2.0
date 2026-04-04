<script setup lang="ts">
/**
 * RouteChart — 경로 통계 라인/에어리어 차트 (클라이언트 전용)
 * 의존성: pnpm add @unovis/vue @unovis/ts
 *
 * Flat 사용:
 *   <RouteChart :data="elevationData" :x="d => d.distance" :y="d => d.elevation" />
 *
 * Props:
 *   data      — 차트 데이터 배열
 *   x         — x축 accessor 함수
 *   y         — y축 accessor 함수
 *   xLabel    — x축 단위 레이블 (예: 'km')
 *   yLabel    — y축 단위 레이블 (예: 'm')
 *   color     — 선/에어리어 색상 (CSS 색상값)
 *   height    — 차트 높이 (px)
 */
import { VisXYContainer, VisLine, VisArea, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'

interface DataPoint {
    [key: string]: number
}

const props = withDefaults(
    defineProps<{
        data: DataPoint[]
        x: (d: DataPoint, i: number) => number
        y: (d: DataPoint, i: number) => number
        xLabel?: string
        yLabel?: string
        color?: string
        height?: number
    }>(),
    {
        color: 'var(--ui-primary)',
        height: 160
    }
)

const tooltipTemplate = (d: DataPoint) => {
    const xVal = props.x(d, 0)
    const yVal = props.y(d, 0)
    return `
    <div style="padding:6px 8px;font-size:12px;color:white">
      ${props.xLabel ? `${xVal}${props.xLabel}` : xVal} · ${props.yLabel ? `${yVal}${props.yLabel}` : yVal}
    </div>
  `
}
</script>

<template>
    <div class="route-chart">
        <VisXYContainer :data="data" :height="height" :style="{ '--vis-color-main': color }">
            <VisArea :x="x" :y="y" :color="color" :opacity="0.15" />
            <VisLine :x="x" :y="y" :color="color" />
            <VisAxis type="x" :tick-format="(v: number) => `${v}${xLabel ?? ''}`" />
            <VisAxis type="y" :tick-format="(v: number) => `${v}${yLabel ?? ''}`" />
            <VisCrosshair :template="tooltipTemplate" />
            <VisTooltip />
        </VisXYContainer>
    </div>
</template>

<style scoped>
.route-chart {
    width: 100%;
    --vis-axis-tick-label-color: var(--sidebar-icon-color);
    --vis-axis-label-color: var(--sidebar-icon-color);
    --vis-axis-domain-color: var(--sidebar-border);
    --vis-axis-grid-color: var(--sidebar-border);
    --vis-crosshair-line-stroke-color: var(--sidebar-icon-color);
    --vis-tooltip-background-color: #1a1a1a;
    --vis-tooltip-border-color: var(--sidebar-border);
    --vis-tooltip-text-color: var(--sidebar-icon-hover);
}
</style>
