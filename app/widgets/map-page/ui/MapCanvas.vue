<script setup lang="ts">
/**
 * 지도 렌더링 표면(Cesium Canvas) + 그 위에 떠 있는 HUD(footer·overlay)를 담는 호스트.
 *
 * - Cesium 은 내부 `#map` div 에 마운트된다(전역 CSS 가 absolute inset-0 로 채움).
 * - htmlPoi(usePoiOverlay)는 `viewer.container`(=`#map` 하위)에 자동 부착되므로 자연히 이 안에 들어온다.
 * - footer·overlay 는 지도 좌표가 아닌 화면에 고정된 map-anchored HUD 라 이 컴포넌트가 positioning 을 소유한다.
 *
 * 페이지 chrome(header·aside·modal·FAB)은 여기 들어오지 않는다 — 그건 page/shell 책임이다.
 */
</script>

<template>
    <div class="relative w-full h-full min-h-0 overflow-hidden">
        <div id="map" class="map-view" />

        <!-- 지도 하단 footer (카메라 정보 등) -->
        <div v-if="$slots.footer" class="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
            <slot name="footer" />
        </div>

        <!-- 지도 위를 덮는 overlay HUD(칩·팝업·플러그인 앵커) -->
        <div
            v-if="$slots.overlay"
            class="absolute inset-0 pointer-events-none z-10 overflow-hidden [&>*]:pointer-events-auto"
        >
            <slot name="overlay" />
        </div>
    </div>
</template>
